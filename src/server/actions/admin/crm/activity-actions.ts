"use server";

import { revalidatePath } from "next/cache";

import { activityAdminRepository } from "@/server/repositories/admin";
import { activityFormSchema } from "@/lib/validations/crm";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";

function revalidate(customerId?: string, dealId?: string) {
  revalidatePath("/admin/crm");
  if (customerId) revalidatePath(`/admin/crm/customers/${customerId}`);
  if (dealId) revalidatePath(`/admin/crm/deals/${dealId}`);
}

export async function createActivity(input: unknown): Promise<ActionResult> {
  const v = validate(activityFormSchema, input);
  if (!v.success) return v.result;
  const d = v.data;
  if (!d.customerId && !d.dealId) {
    return fail("Активность должна быть привязана к клиенту или сделке");
  }
  try {
    await activityAdminRepository.create({
      type: d.type,
      subject: d.subject,
      body: d.body || null,
      dueAt: d.dueAt ? new Date(d.dueAt) : null,
      ...(d.customerId ? { customer: { connect: { id: d.customerId } } } : {}),
      ...(d.dealId ? { deal: { connect: { id: d.dealId } } } : {}),
    });
    revalidate(d.customerId || undefined, d.dealId || undefined);
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function toggleActivityDone(id: string, done: boolean): Promise<ActionResult> {
  try {
    await activityAdminRepository.toggleDone(id, done);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteActivity(id: string): Promise<ActionResult> {
  try {
    await activityAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
