"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { brandAdminRepository } from "@/server/repositories/admin";
import { brandFormSchema } from "@/lib/validations/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";

function revalidate() {
  revalidatePath("/admin/brands");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.brands);
}

export async function createBrand(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(brandFormSchema, input);
  if (!v.success) return v.result;
  try {
    await brandAdminRepository.create({
      slug: v.data.slug,
      name: v.data.name,
      origin: v.data.origin || null,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateBrand(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(brandFormSchema, input);
  if (!v.success) return v.result;
  try {
    await brandAdminRepository.update(id, {
      slug: v.data.slug,
      name: v.data.name,
      origin: v.data.origin || null,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    const count = await brandAdminRepository.countProducts(id);
    if (count > 0) {
      return fail(`Нельзя удалить: у производителя ${count} товаров.`);
    }
    await brandAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
