"use server";

import { revalidatePath } from "next/cache";

import { documentAdminRepository } from "@/server/repositories/admin";
import { documentFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";

function revalidate() {
  revalidatePath("/admin/documents");
  revalidatePath("/catalog");
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
