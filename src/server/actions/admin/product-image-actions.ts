"use server";

import { revalidatePath } from "next/cache";

import { productImageAdminRepository } from "@/server/repositories/admin";
import { productImageFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";

function revalidate() {
  revalidatePath("/admin/product-images");
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

export async function createProductImage(input: unknown): Promise<ActionResult> {
  const v = validate(productImageFormSchema, input);
  if (!v.success) return v.result;
  try {
    await productImageAdminRepository.create({
      url: v.data.url,
      alt: v.data.alt || null,
      order: v.data.order,
      product: { connect: { id: v.data.productId } },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateProductImage(id: string, input: unknown): Promise<ActionResult> {
  const v = validate(productImageFormSchema, input);
  if (!v.success) return v.result;
  try {
    await productImageAdminRepository.update(id, {
      url: v.data.url,
      alt: v.data.alt || null,
      order: v.data.order,
      product: { connect: { id: v.data.productId } },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteProductImage(id: string): Promise<ActionResult> {
  try {
    await productImageAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
