"use server";

import { revalidatePath } from "next/cache";

import { dealAdminRepository } from "@/server/repositories/admin";
import { dealFormSchema, dealStage } from "@/lib/validations/crm";
import { tengeToTiyn } from "@/lib/money";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";

function revalidate() {
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/deals");
}

function amount(amountTenge: number | "" | undefined): number | null {
  if (amountTenge === "" || amountTenge === undefined) return null;
  return tengeToTiyn(amountTenge);
}

export async function createDeal(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(dealFormSchema, input);
  if (!v.success) return v.result;
  const d = v.data;
  try {
    const deal = await dealAdminRepository.create({
      title: d.title,
      stage: d.stage,
      amount: amount(d.amountTenge),
      probability: d.probability,
      expectedAt: d.expectedAt ? new Date(d.expectedAt) : null,
      lostReason: d.lostReason || null,
      customer: { connect: { id: d.customerId } },
      ...(d.ownerId ? { owner: { connect: { id: d.ownerId } } } : {}),
    });
    await audit({
      action: "CREATE",
      entity: "Deal",
      entityId: deal.id,
      summary: `Сделка создана: ${d.title}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateDeal(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(dealFormSchema, input);
  if (!v.success) return v.result;
  const d = v.data;
  try {
    await dealAdminRepository.update(id, {
      title: d.title,
      stage: d.stage,
      amount: amount(d.amountTenge),
      probability: d.probability,
      expectedAt: d.expectedAt ? new Date(d.expectedAt) : null,
      lostReason: d.lostReason || null,
      customer: { connect: { id: d.customerId } },
      owner: d.ownerId ? { connect: { id: d.ownerId } } : { disconnect: true },
    });
    await audit({
      action: "UPDATE",
      entity: "Deal",
      entityId: id,
      summary: `Сделка изменена: ${d.title}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function setDealStage(id: string, stage: string): Promise<ActionResult> {
  await requireStaff();
  const parsed = dealStage.safeParse(stage);
  if (!parsed.success) return fail("Некорректная стадия");
  try {
    await dealAdminRepository.setStage(id, parsed.data);
    await audit({
      action: "UPDATE",
      entity: "Deal",
      entityId: id,
      summary: `Стадия сделки изменена: ${parsed.data}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteDeal(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await dealAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "Deal",
      entityId: id,
      summary: `Сделка удалена (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
