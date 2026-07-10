"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { importRepository } from "@/server/repositories/admin/import-repository";
import { buildPreview, type ImportContext } from "@/lib/import/validators";
import type { ImportKind, ImportResult, ImportIssue, PreparedRow } from "@/types/import";
import { tengeToTiyn } from "@/lib/money";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** Build the reference context (also exposed for client-side preview). */
async function loadContext(): Promise<ImportContext> {
  const { categories, brands, products, warehouses } = await importRepository.loadContext();
  return {
    categorySlugs: new Set(categories.map((c) => c.slug)),
    categoryTitleToSlug: new Map(categories.map((c) => [c.title.toLowerCase(), c.slug])),
    brandSlugs: new Set(brands.map((b) => b.slug)),
    brandNameToSlug: new Map(brands.map((b) => [b.name.toLowerCase(), b.slug])),
    productSkus: new Set(products.map((p) => p.sku)),
    warehouseCodes: new Set(warehouses.map((w) => w.code)),
    warehouseNameToCode: new Map(warehouses.map((w) => [w.name.toLowerCase(), w.code])),
  };
}

/** Serialize the context Sets/Maps so the client can validate without a DB. */
export async function getImportContext() {
  const { categories, brands, products, warehouses } = await importRepository.loadContext();
  return { categories, brands, products, warehouses };
}

const BADGE_ENUM: Record<string, "HIT" | "NEW" | "IN_STOCK"> = {
  HIT: "HIT",
  NEW: "NEW",
  IN_STOCK: "IN_STOCK",
};


function collectErrors(rows: PreparedRow[]): ImportIssue[] {
  return rows.flatMap((r) => r.issues.filter((i) => i.level === "error"));
}

/**
 * Apply an import batch. Re-parses + re-validates server-side from the raw rows
 * (never trusts client-prepared data), then writes valid rows in chunks.
 */
export async function applyImport(
  kind: ImportKind,
  rawRows: Record<string, string>[],
  fileName: string
): Promise<ImportResult> {
  await requireStaff();
  const ctx = await loadContext();
  const preview = buildPreview(kind, rawRows, [], fileName, ctx);
  const valid = preview.rows.filter((r) => r.action !== "skip");
  const errors = collectErrors(preview.rows);

  let created = 0;
  let updated = 0;
  let failed = 0;
  const runtimeErrors: ImportIssue[] = [];

  try {
    if (kind === "categories") {
      for (const r of valid) {
        const d = r.data as Record<string, string | number>;
        try {
          await prisma.category.upsert({
            where: { slug: String(d.slug) },
            update: {
              title: String(d.title),
              description: String(d.description || "") || null,
              spec: String(d.spec || "") || null,
              icon: String(d.icon || "") || null,
              order: Number(d.order) || 0,
            },
            create: {
              slug: String(d.slug),
              title: String(d.title),
              description: String(d.description || "") || null,
              spec: String(d.spec || "") || null,
              icon: String(d.icon || "") || null,
              order: Number(d.order) || 0,
            },
          });
          r.action === "create" ? created++ : updated++;
        } catch {
          failed++;
          runtimeErrors.push({ row: r.row, level: "error", message: "Ошибка записи категории" });
        }
      }
    } else if (kind === "brands") {
      for (const r of valid) {
        const d = r.data as Record<string, string>;
        try {
          await prisma.brand.upsert({
            where: { slug: String(d.slug) },
            update: { name: String(d.name), origin: String(d.origin || "") || null },
            create: { slug: String(d.slug), name: String(d.name), origin: String(d.origin || "") || null },
          });
          r.action === "create" ? created++ : updated++;
        } catch {
          failed++;
          runtimeErrors.push({ row: r.row, level: "error", message: "Ошибка записи производителя" });
        }
      }
    } else if (kind === "products") {
      // Resolve slugs → ids once.
      const [cats, brands] = await Promise.all([
        importRepository.categoryIdBySlug(),
        importRepository.brandIdBySlug(),
      ]);
      const catId = new Map(cats.map((c) => [c.slug, c.id]));
      const brandId = new Map(brands.map((b) => [b.slug, b.id]));
      // Resolve the default warehouse once, not per-product (was an N+1).
      const defaultWarehouse = await prisma.warehouse.findFirst({ orderBy: { code: "asc" } });

      for (const r of valid) {
        const d = r.data as Record<string, unknown>;
        const cId = catId.get(String(d.categorySlug));
        const bId = brandId.get(String(d.brandSlug));
        if (!cId || !bId) {
          failed++;
          runtimeErrors.push({ row: r.row, level: "error", message: "Категория/производитель не разрешены" });
          continue;
        }
        const sku = String(d.sku);
        const slug = String(d.slug || "");
        const price = d.price as number | null;
        const stock = d.stock as number | null;
        const badge = d.badge ? BADGE_ENUM[String(d.badge)] : null;
        const imageUrls = (d.imageUrls as string[]) ?? [];

        try {
          const product = await prisma.product.upsert({
            where: { sku },
            update: {
              title: String(d.title),
              slug: slug || undefined,
              description: String(d.description || "") || null,
              unit: String(d.unit || "шт") || "шт",
              badge,
              popularity: Number(d.popularity) || 0,
              warranty: String(d.warranty || "") || null,
              leadTime: String(d.leadTime || "") || null,
              published: Boolean(d.published),
              category: { connect: { id: cId } },
              brand: { connect: { id: bId } },
            },
            create: {
              sku,
              slug: slug || sku.toLowerCase(),
              title: String(d.title),
              description: String(d.description || "") || null,
              unit: String(d.unit || "шт") || "шт",
              badge,
              popularity: Number(d.popularity) || 0,
              warranty: String(d.warranty || "") || null,
              leadTime: String(d.leadTime || "") || null,
              published: Boolean(d.published),
              category: { connect: { id: cId } },
              brand: { connect: { id: bId } },
            },
          });

          // Base price — atomic upsert on the (productId, kind) unique key.
          if (price !== null && price !== undefined) {
            await prisma.price.upsert({
              where: { productId_kind: { productId: product.id, kind: "BASE" } },
              update: { amount: tengeToTiyn(price) },
              create: { productId: product.id, kind: "BASE", amount: tengeToTiyn(price), minQty: 1 },
            });
          }

          // Stock on the default warehouse — atomic upsert.
          if (stock !== null && stock !== undefined && defaultWarehouse) {
            await prisma.stock.upsert({
              where: {
                productId_warehouseId: { productId: product.id, warehouseId: defaultWarehouse.id },
              },
              update: { quantity: stock },
              create: { productId: product.id, warehouseId: defaultWarehouse.id, quantity: stock },
            });
          }

          // Images by URL — replace set when provided.
          if (imageUrls.length > 0) {
            await prisma.productImage.deleteMany({ where: { productId: product.id } });
            await prisma.productImage.createMany({
              data: imageUrls.map((url, i) => ({ productId: product.id, url, alt: String(d.title), order: i })),
            });
          }

          r.action === "create" ? created++ : updated++;
        } catch {
          failed++;
          runtimeErrors.push({ row: r.row, level: "error", message: `Ошибка записи товара (${sku})` });
        }
      }
    } else if (kind === "prices") {
      const products = await importRepository.productIdBySku();
      const pid = new Map(products.map((p) => [p.sku, p.id]));
      for (const r of valid) {
        const d = r.data as Record<string, unknown>;
        const productId = pid.get(String(d.sku));
        if (!productId) {
          failed++;
          runtimeErrors.push({ row: r.row, level: "error", message: "Товар не найден" });
          continue;
        }
        const price = d.price as number | null;
        const knd = String(d.kind) as "BASE" | "WHOLESALE" | "PROMO";
        const minQty = Number(d.minQty) || 1;
        try {
          await prisma.price.upsert({
            where: { productId_kind: { productId, kind: knd } },
            update: { amount: price === null ? null : tengeToTiyn(price), minQty },
            create: { productId, kind: knd, amount: price === null ? null : tengeToTiyn(price), minQty },
          });
          updated++;
        } catch {
          failed++;
          runtimeErrors.push({ row: r.row, level: "error", message: "Ошибка записи цены" });
        }
      }
    } else if (kind === "stock") {
      const [products, warehouses] = await Promise.all([
        importRepository.productIdBySku(),
        importRepository.warehouseIdByCode(),
      ]);
      const pid = new Map(products.map((p) => [p.sku, p.id]));
      const wid = new Map(warehouses.map((w) => [w.code, w.id]));
      for (const r of valid) {
        const d = r.data as Record<string, unknown>;
        const productId = pid.get(String(d.sku));
        const warehouseId = wid.get(String(d.warehouseCode));
        if (!productId || !warehouseId) {
          failed++;
          runtimeErrors.push({ row: r.row, level: "error", message: "Товар/склад не найдены" });
          continue;
        }
        const quantity = Number(d.quantity) || 0;
        try {
          await prisma.stock.upsert({
            where: { productId_warehouseId: { productId, warehouseId } },
            update: { quantity },
            create: { productId, warehouseId, quantity },
          });
          updated++;
        } catch {
          failed++;
          runtimeErrors.push({ row: r.row, level: "error", message: "Ошибка записи остатка" });
        }
      }
    }
  } catch {
    return {
      ok: false,
      created,
      updated,
      skipped: preview.counts.skip,
      failed,
      errors: [...errors, ...runtimeErrors],
      message: "Импорт прерван из-за ошибки. Часть данных могла записаться.",
    };
  }

  // Refresh public + admin views affected by this import.
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/brands");
  revalidatePath("/admin/prices");
  revalidatePath("/admin/warehouses");
  revalidateTag(CACHE_TAGS.products);
  revalidateTag(CACHE_TAGS.categories);
  revalidateTag(CACHE_TAGS.brands);

  await audit({
    action: "IMPORT",
    entity: kind,
    summary: `Импорт «${fileName}»: создано ${created}, обновлено ${updated}, ошибок ${failed}`,
    meta: { fileName, created, updated, failed, skipped: preview.counts.skip },
  });

  return {
    ok: failed === 0,
    created,
    updated,
    skipped: preview.counts.skip,
    failed,
    errors: [...errors, ...runtimeErrors],
    message:
      failed === 0
        ? `Импорт завершён: создано ${created}, обновлено ${updated}, пропущено ${preview.counts.skip}.`
        : `Импорт завершён с ошибками: ${failed} строк не записано.`,
  };
}
