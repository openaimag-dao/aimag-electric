"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { productAdminRepository } from "@/server/repositories/admin";
import { productFormSchema } from "@/lib/validations/admin";
import { ok, validate, toActionError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";
import { CACHE_TAGS } from "@/lib/cache-tags";

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
    await audit({ action: "CREATE", entity: "Product", entityId: product.id, summary: `Товар создан: ${v.data.title}` });
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
    await audit({ action: "UPDATE", entity: "Product", entityId: id, summary: `Товар изменён: ${v.data.title}` });
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
    await audit({ action: "DELETE", entity: "Product", entityId: id, summary: `Товар удалён (${id})` });
    revalidate();
    return ok();
  } catch (e) {
    return toActionError(e);
  }
}
