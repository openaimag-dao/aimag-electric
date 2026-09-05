"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";

import { productAdminRepository } from "@/server/repositories/admin";
import { productFormSchema } from "@/lib/validations/admin";
import {
  ok,
  fail,
  validate,
  toActionError,
  type ActionResult,
} from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  titleSimilarity,
  DUPLICATE_TITLE_SIMILARITY_THRESHOLD,
} from "@/lib/admin/duplicate-detection";

export interface DuplicateCandidate {
  id: string;
  title: string;
  sku: string;
  slug: string;
}

/** Soft duplicate check — same brand + very similar title. Not a hard block. */
export async function findPossibleDuplicates(input: {
  title: string;
  brandId: string;
  excludeId?: string;
}): Promise<ActionResult<DuplicateCandidate[]>> {
  await requireStaff();
  if (!input.title.trim() || !input.brandId) return ok([]);
  const candidates = await productAdminRepository.listByBrand(input.brandId, input.excludeId);
  const matches = candidates.filter(
    (c) => titleSimilarity(c.title, input.title) >= DUPLICATE_TITLE_SIMILARITY_THRESHOLD
  );
  return ok(matches);
}

export interface BulkProductPatch {
  categoryId?: string;
  brandId?: string;
  published?: boolean;
}

/** Applies category/brand/status changes to a selected set of products at once. */
export async function bulkUpdateProducts(
  ids: string[],
  patch: BulkProductPatch
): Promise<ActionResult<{ count: number }>> {
  await requireStaff();
  if (ids.length === 0) return fail("Не выбрано ни одного товара");
  const data: Prisma.ProductUncheckedUpdateManyInput = {};
  if (patch.categoryId) data.categoryId = patch.categoryId;
  if (patch.brandId) data.brandId = patch.brandId;
  if (patch.published !== undefined) data.published = patch.published;
  if (Object.keys(data).length === 0) return fail("Не выбрано ни одного изменения");
  try {
    const result = await productAdminRepository.bulkUpdate(ids, data);
    await audit({
      action: "UPDATE",
      entity: "Product",
      summary: `Массовое изменение: ${result.count} товар(ов)`,
      meta: { ids, patch },
    });
    revalidate();
    return ok({ count: result.count });
  } catch (e) {
    return toActionError(e);
  }
}

function revalidate() {
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.products);
}

function toData(d: ReturnType<typeof productFormSchema.parse>) {
  return {
    slug: d.slug,
    sku: d.sku,
    title: d.title,
    description: d.description || null,
    unit: d.unit,
    packaging: d.packaging || null,
    warranty: d.warranty || null,
    leadTime: d.leadTime || null,
    badge: d.badge ? d.badge : null,
    popularity: d.popularity,
    published: d.published,
    isFeatured: d.isFeatured,
    category: { connect: { id: d.categoryId } },
    brand: { connect: { id: d.brandId } },
  };
}

export async function createProduct(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(productFormSchema, input);
  if (!v.success) return v.result;
  try {
    const product = await productAdminRepository.create(toData(v.data));
    await audit({
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      summary: `Товар создан: ${v.data.title}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(productFormSchema, input);
  if (!v.success) return v.result;
  try {
    await productAdminRepository.update(id, toData(v.data));
    await audit({
      action: "UPDATE",
      entity: "Product",
      entityId: id,
      summary: `Товар изменён: ${v.data.title}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await productAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "Product",
      entityId: id,
      summary: `Товар удалён (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return toActionError(e);
  }
}
