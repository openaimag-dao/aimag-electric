"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { categoryAdminRepository, categoryAttributeRepository } from "@/server/repositories/admin";
import { categoryFormSchema } from "@/lib/validations/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";

function revalidate() {
  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.categories);
}

export async function createCategory(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(categoryFormSchema, input);
  if (!v.success) return v.result;
  try {
    await categoryAdminRepository.create({
      slug: v.data.slug,
      title: v.data.title,
      description: v.data.description || null,
      spec: v.data.spec || null,
      icon: v.data.icon || null,
      image: v.data.image || null,
      order: v.data.order,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(categoryFormSchema, input);
  if (!v.success) return v.result;
  try {
    await categoryAdminRepository.update(id, {
      slug: v.data.slug,
      title: v.data.title,
      description: v.data.description || null,
      spec: v.data.spec || null,
      icon: v.data.icon || null,
      image: v.data.image || null,
      order: v.data.order,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    const count = await categoryAdminRepository.countProducts(id);
    if (count > 0) {
      return fail(`Нельзя удалить: в категории ${count} товаров. Сначала перенесите их.`);
    }
    await categoryAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export interface CategoryAttributeTemplateItem {
  attributeId: string;
  required: boolean;
}

export async function getCategoryAttributeTemplate(
  categoryId: string
): Promise<ActionResult<CategoryAttributeTemplateItem[]>> {
  await requireStaff();
  try {
    const rows = await categoryAttributeRepository.listForCategory(categoryId);
    return ok(rows.map((r) => ({ attributeId: r.attributeId, required: r.required })));
  } catch (e) {
    return fail(prismaError(e));
  }
}

/** Replaces the category's "which characteristics matter" template in one go. */
export async function setCategoryAttributeTemplate(
  categoryId: string,
  items: CategoryAttributeTemplateItem[]
): Promise<ActionResult> {
  await requireStaff();
  try {
    await categoryAttributeRepository.setForCategory(
      categoryId,
      items.map((item, i) => ({ ...item, order: i }))
    );
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
