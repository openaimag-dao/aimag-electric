"use server";

import { revalidatePath } from "next/cache";

import { customerAdminRepository } from "@/server/repositories/admin";
import { customerFormSchema } from "@/lib/validations/crm";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";

function revalidate() {
  revalidatePath("/admin/crm/customers");
  revalidatePath("/admin/crm");
}

function toData(d: ReturnType<typeof customerFormSchema.parse>) {
  return {
    company: d.company,
    contact: d.contact || null,
    phone: d.phone || null,
    email: d.email || null,
    city: d.city || null,
    bin: d.bin || null,
    notes: d.notes || null,
    status: d.status,
    ...(d.ownerId ? { owner: { connect: { id: d.ownerId } } } : {}),
  };
}

export async function createCustomer(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(customerFormSchema, input);
  if (!v.success) return v.result;
  try {
    const customer = await customerAdminRepository.create(toData(v.data));
    await audit({
      action: "CREATE",
      entity: "Customer",
      entityId: customer.id,
      summary: `Клиент создан: ${v.data.company}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateCustomer(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(customerFormSchema, input);
  if (!v.success) return v.result;
  try {
    const d = v.data;
    await customerAdminRepository.update(id, {
      company: d.company,
      contact: d.contact || null,
      phone: d.phone || null,
      email: d.email || null,
      city: d.city || null,
      bin: d.bin || null,
      notes: d.notes || null,
      status: d.status,
      owner: d.ownerId ? { connect: { id: d.ownerId } } : { disconnect: true },
    });
    await audit({
      action: "UPDATE",
      entity: "Customer",
      entityId: id,
      summary: `Клиент изменён: ${v.data.company}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await customerAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "Customer",
      entityId: id,
      summary: `Клиент удалён (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
