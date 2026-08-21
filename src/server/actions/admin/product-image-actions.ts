"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

import { productImageAdminRepository } from "@/server/repositories/admin";
import { productImageFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, formatFileSize } from "@/lib/uploads";

function revalidate() {
  revalidatePath("/admin/product-images");
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

/** Images for one product — powers the inline photo panel in the product edit dialog. */
export async function getProductImages(productId: string) {
  await requireStaff();
  const rows = await productImageAdminRepository.listForProduct(productId);
  return rows.map((r) => ({ id: r.id, url: r.url ?? "", alt: r.alt, order: r.order }));
}

export async function createProductImage(input: unknown): Promise<ActionResult> {
  await requireStaff();
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
  await requireStaff();
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

/** Uploads a real image file to Vercel Blob and returns its public URL — the caller still calls createProductImage with it, same as the URL-paste flow. */
export async function uploadProductImageFile(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Файл не выбран");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return fail("Поддерживаются только изображения: JPEG, PNG, WebP, GIF");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return fail(`Файл слишком большой (макс. ${formatFileSize(MAX_IMAGE_SIZE)})`);
  }
  try {
    const blob = await put(`product-images/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
    });
    return ok({ url: blob.url });
  } catch {
    return fail("Не удалось загрузить файл. Проверьте, что хранилище подключено.");
  }
}

export async function deleteProductImage(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await productImageAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
