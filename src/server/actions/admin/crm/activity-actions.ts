"use server";

import { revalidatePath } from "next/cache";

import { activityAdminRepository } from "@/server/repositories/admin";
import { activityFormSchema } from "@/lib/validations/crm";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";

function revalidate(customerId?: string, dealId?: string) {
  revalidatePath("/admin/crm");
  if (customerId) revalidatePath(`/admin/crm/customers/${customerId}`);
  if (dealId) revalidatePath(`/admin/crm/deals/${dealId}`);
}

export async function createActivity(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(activityFormSchema, input);
  if (!v.success) return v.result;
  const d = v.data;
  if (!d.customerId && !d.dealId) {
    return fail("Активность должна быть привязана к клиенту или сделке");
  }
  try {
    const activity = await activityAdminRepository.create({
      type: d.type,
      subject: d.subject,
      body: d.body || null,
      dueAt: d.dueAt ? new Date(d.dueAt) : null,
      ...(d.customerId ? { customer: { connect: { id: d.customerId } } } : {}),
      ...(d.dealId ? { deal: { connect: { id: d.dealId } } } : {}),
    });
    await audit({
      action: "CREATE",
      entity: "Activity",
      entityId: activity.id,
      summary: `Активность добавлена: ${d.subject}`,
      meta: { customerId: d.customerId, dealId: d.dealId, type: d.type },
    });
    revalidate(d.customerId || undefined, d.dealId || undefined);
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function toggleActivityDone(id: string, done: boolean): Promise<ActionResult> {
  await requireStaff();
  try {
    await activityAdminRepository.toggleDone(id, done);
    await audit({
      action: "UPDATE",
      entity: "Activity",
      entityId: id,
      summary: done ? "Активность отмечена выполненной" : "Активность возвращена в работу",
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteActivity(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await activityAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "Activity",
      entityId: id,
      summary: `Активность удалена (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
