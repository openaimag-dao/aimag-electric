"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { categoryAdminRepository } from "@/server/repositories/admin";
import { categoryFormSchema } from "@/lib/validations/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";

function revalidate() {
  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.categories);
}

export async function createCategory(input: unknown): Promise<ActionResult> {
  const v = validate(categoryFormSchema, input);
  if (!v.success) return v.result;
  try {
    await categoryAdminRepository.create({
      slug: v.data.slug,
      title: v.data.title,
      description: v.data.description || null,
      spec: v.data.spec || null,
      icon: v.data.icon || null,
      order: v.data.order,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  const v = validate(categoryFormSchema, input);
  if (!v.success) return v.result;
  try {
    await categoryAdminRepository.update(id, {
      slug: v.data.slug,
      title: v.data.title,
      description: v.data.description || null,
      spec: v.data.spec || null,
      icon: v.data.icon || null,
      order: v.data.order,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
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
