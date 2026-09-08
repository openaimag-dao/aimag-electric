"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { categoryAdminRepository, categoryAttributeRepository } from "@/server/repositories/admin";
import { categoryFormSchema } from "@/lib/validations/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";
import { mergedCategorySlugs } from "@/config/category-merges";

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
    const category = await categoryAdminRepository.create({
      slug: v.data.slug,
      title: v.data.title,
      description: v.data.description || null,
      spec: v.data.spec || null,
      icon: v.data.icon || null,
      image: v.data.image || null,
      order: v.data.order,
    });
    await audit({
      action: "CREATE",
      entity: "Category",
      entityId: category.id,
      summary: `Категория создана: ${v.data.title}`,
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
    await audit({
      action: "UPDATE",
      entity: "Category",
      entityId: id,
      summary: `Категория изменена: ${v.data.title}`,
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
    await audit({
      action: "DELETE",
      entity: "Category",
      entityId: id,
      summary: `Категория удалена (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

/**
 * Runs every pending merge from src/config/category-merges.ts: for each old
 * slug whose Category row still exists, reassigns its products to the
 * surviving category and deletes it. A slug with no matching row (already
 * merged, or never existed on this DB) is silently skipped — safe to call
 * repeatedly, including after a previous partial run.
 */
export async function mergeDuplicateCategories(): Promise<
  ActionResult<{ merged: number; productsMoved: number }>
> {
  await requireStaff();
  try {
    const rows = await categoryAdminRepository.list();
    const bySlug = new Map(rows.map((c) => [c.slug, c]));
    let merged = 0;
    let productsMoved = 0;
    for (const [oldSlug, newSlug] of Object.entries(mergedCategorySlugs)) {
      const oldCat = bySlug.get(oldSlug);
      const newCat = bySlug.get(newSlug);
      if (!oldCat || !newCat) continue;
      const { productsMoved: moved } = await categoryAdminRepository.mergeInto(
        oldCat.id,
        newCat.id
      );
      merged += 1;
      productsMoved += moved;
      await audit({
        action: "DELETE",
        entity: "Category",
        entityId: oldCat.id,
        summary: `Категория «${oldCat.title}» объединена с «${newCat.title}»: перенесено ${moved} товар(ов), категория удалена`,
        meta: { oldSlug, newSlug, productsMoved: moved },
      });
    }
    revalidate();
    revalidatePath("/admin/products");
    return ok({ merged, productsMoved });
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
