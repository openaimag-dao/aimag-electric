"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

import { documentAdminRepository } from "@/server/repositories/admin";
import { documentFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE, formatFileSize } from "@/lib/uploads";

function revalidate() {
  revalidatePath("/admin/documents");
  revalidatePath("/catalog");
}

/** Uploads a real document file to Vercel Blob and returns its URL + human-readable size — the form still submits through createDocument/updateDocument, same as the URL-paste flow. */
export async function uploadDocumentFile(
  formData: FormData
): Promise<ActionResult<{ url: string; size: string }>> {
  await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Файл не выбран");
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return fail("Поддерживаются только PDF, DOC(X), XLS(X)");
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return fail(`Файл слишком большой (макс. ${formatFileSize(MAX_DOCUMENT_SIZE)})`);
  }
  try {
    const blob = await put(`product-documents/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
    });
    return ok({ url: blob.url, size: formatFileSize(file.size) });
  } catch {
    return fail("Не удалось загрузить файл. Проверьте, что хранилище подключено.");
  }
}

export async function createDocument(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(documentFormSchema, input);
  if (!v.success) return v.result;
  try {
    await documentAdminRepository.create({
      title: v.data.title,
      kind: v.data.kind,
      url: v.data.url,
      size: v.data.size || null,
      order: v.data.order,
      product: { connect: { id: v.data.productId } },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateDocument(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(documentFormSchema, input);
  if (!v.success) return v.result;
  try {
    await documentAdminRepository.update(id, {
      title: v.data.title,
      kind: v.data.kind,
      url: v.data.url,
      size: v.data.size || null,
      order: v.data.order,
      product: { connect: { id: v.data.productId } },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await documentAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
