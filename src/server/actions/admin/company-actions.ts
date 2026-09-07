"use server";

import { revalidatePath } from "next/cache";

import { companyAdminRepository } from "@/server/repositories/admin";
import { companyFormSchema, companyMemberFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";

function revalidate() {
  revalidatePath("/admin/companies");
  revalidatePath("/account");
}

export async function createCompany(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(companyFormSchema, input);
  if (!v.success) return v.result;
  try {
    const company = await companyAdminRepository.create({
      name: v.data.name,
      bin: v.data.bin || null,
      legalAddress: v.data.legalAddress || null,
      actualAddress: v.data.actualAddress || null,
      phone: v.data.phone || null,
      email: v.data.email || null,
      notes: v.data.notes || null,
    });
    await audit({
      action: "CREATE",
      entity: "Company",
      entityId: company.id,
      summary: `Компания создана: ${v.data.name}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateCompany(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(companyFormSchema, input);
  if (!v.success) return v.result;
  try {
    await companyAdminRepository.update(id, {
      name: v.data.name,
      bin: v.data.bin || null,
      legalAddress: v.data.legalAddress || null,
      actualAddress: v.data.actualAddress || null,
      phone: v.data.phone || null,
      email: v.data.email || null,
      notes: v.data.notes || null,
    });
    await audit({
      action: "UPDATE",
      entity: "Company",
      entityId: id,
      summary: `Компания изменена: ${v.data.name}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await companyAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "Company",
      entityId: id,
      summary: `Компания удалена (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function getCompany(id: string) {
  await requireStaff();
  return companyAdminRepository.byId(id);
}

export async function addCompanyMember(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(companyMemberFormSchema, input);
  if (!v.success) return v.result;
  try {
    await companyAdminRepository.addMember(v.data.companyId, v.data.userId, v.data.role);
    await audit({
      action: "CREATE",
      entity: "CompanyMember",
      entityId: v.data.userId,
      summary: `Сотрудник добавлен в компанию (${v.data.role})`,
      meta: { companyId: v.data.companyId, userId: v.data.userId, role: v.data.role },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateCompanyMemberRole(id: string, role: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(companyMemberFormSchema.pick({ role: true }), { role });
  if (!v.success) return v.result;
  try {
    await companyAdminRepository.updateMemberRole(id, v.data.role);
    await audit({
      action: "UPDATE",
      entity: "CompanyMember",
      entityId: id,
      summary: `Роль сотрудника изменена: ${v.data.role}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function removeCompanyMember(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await companyAdminRepository.removeMember(id);
    await audit({
      action: "DELETE",
      entity: "CompanyMember",
      entityId: id,
      summary: `Сотрудник удалён из компании (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
