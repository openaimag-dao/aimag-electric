"use server";

import { productAdminRepository } from "@/server/repositories/admin";
import { rowsToWorkbook } from "@/lib/import/parse-sheet";
import { tiynToTenge } from "@/lib/money";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";
import { ok, toActionError, type ActionResult } from "@/server/actions/action-result";
import type { AdminProductsQuery } from "@/lib/admin/products-url";

export interface ExportResult {
  base64: string;
  filename: string;
  count: number;
}

/** Exports the products matching the current /admin/products filters to an .xlsx workbook. */
export async function exportProductsXlsx(
  query: Pick<AdminProductsQuery, "q" | "category" | "brand" | "status" | "quality">
): Promise<ActionResult<ExportResult>> {
  await requireStaff();
  try {
    const rows = await productAdminRepository.listForExport({
      q: query.q || undefined,
      categoryId: query.category || undefined,
      brandId: query.brand || undefined,
      published:
        query.status === "published" ? true : query.status === "hidden" ? false : undefined,
      quality: query.quality || undefined,
    });

    const sheetRows = rows.map((p) => {
      const base = p.prices.find((price) => price.kind === "BASE") ?? p.prices[0];
      const stockTotal = p.stock.reduce((sum, s) => sum + s.quantity, 0);
      return {
        Артикул: p.sku,
        Название: p.title,
        Slug: p.slug,
        Категория: p.category.title,
        Производитель: p.brand.name,
        Единица: p.unit,
        "Цена, ₸": base?.amount != null ? tiynToTenge(base.amount) : "",
        Остаток: stockTotal,
        Описание: p.description ?? "",
        Бейдж: p.badge ?? "",
        Популярность: p.popularity,
        Гарантия: p.warranty ?? "",
        "Срок поставки": p.leadTime ?? "",
        Опубликован: p.published ? "да" : "нет",
      };
    });

    const buffer = rowsToWorkbook(sheetRows, "Товары");
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;

    await audit({
      action: "EXPORT",
      entity: "Product",
      summary: `Экспорт товаров в XLSX: ${rows.length} шт.`,
    });

    return ok({ base64, filename, count: rows.length });
  } catch (e) {
    return toActionError(e);
  }
}
