"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

import { orderAdminRepository } from "@/server/repositories/admin";
import {
  orderStatus,
  orderDeliveryFormSchema,
  orderDocumentFormSchema,
} from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE, formatFileSize } from "@/lib/uploads";

function revalidate(id?: string) {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/quotes");
  if (id) revalidatePath(`/admin/orders/${id}`);
}

/** Phase 16: Quote → Order. Only succeeds for a WON quote that doesn't already have an order. */
export async function createOrderFromQuote(quoteId: string): Promise<ActionResult<{ id: string }>> {
  await requireStaff();
  try {
    const order = await orderAdminRepository.createFromQuote(quoteId);
    revalidate();
    return ok({ id: order.id });
  } catch (e) {
    const message = (e as Error)?.message;
    if (message === "QUOTE_NOT_APPROVED") return fail("КП ещё не одобрено клиентом");
    if (message === "ORDER_ALREADY_EXISTS") return fail("Заказ по этому КП уже создан");
    if (message === "QUOTE_NOT_FOUND") return fail("КП не найдено");
    return fail(prismaError(e));
  }
}

export async function setOrderStatus(id: string, status: unknown): Promise<ActionResult> {
  await requireStaff();
  const parsed = orderStatus.safeParse(status);
  if (!parsed.success) return fail("Некорректный статус");
  try {
    await orderAdminRepository.updateStatus(id, parsed.data);
    revalidate(id);
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateOrderDelivery(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(orderDeliveryFormSchema, input);
  if (!v.success) return v.result;
  try {
    await orderAdminRepository.updateDelivery(id, {
      carrier: v.data.carrier || null,
      trackingNumber: v.data.trackingNumber || null,
      estimatedDelivery: v.data.estimatedDelivery ? new Date(v.data.estimatedDelivery) : null,
      actualDelivery: v.data.actualDelivery ? new Date(v.data.actualDelivery) : null,
    });
    revalidate(id);
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await orderAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

/** Uploads a real order document to Vercel Blob — same pattern as uploadDocumentFile for products. */
export async function uploadOrderDocumentFile(
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
    const blob = await put(`order-documents/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
    });
    return ok({ url: blob.url, size: formatFileSize(file.size) });
  } catch {
    return fail("Не удалось загрузить файл. Проверьте, что хранилище подключено.");
  }
}

export async function addOrderDocument(orderId: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(orderDocumentFormSchema, input);
  if (!v.success) return v.result;
  try {
    await orderAdminRepository.addDocument(orderId, {
      title: v.data.title,
      kind: v.data.kind,
      url: v.data.url,
      size: v.data.size || null,
    });
    revalidate(orderId);
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function removeOrderDocument(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await orderAdminRepository.removeDocument(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
