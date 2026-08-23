"use server";

import { revalidatePath } from "next/cache";

import { companyAdminRepository, userAdminRepository } from "@/server/repositories/admin";
import { requireUser } from "@/lib/security/rbac";
import { teamInviteFormSchema, teamRoleFormSchema } from "@/lib/validations/company-team";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";

function revalidate() {
  revalidatePath("/account/company");
}

/** Throws-as-fail guard: is this user a COMPANY_ADMIN of this specific company? */
async function requireCompanyAdmin(userId: string, companyId: string) {
  const memberships = await companyAdminRepository.membershipsForUser(userId);
  const membership = memberships.find((m) => m.companyId === companyId);
  if (!membership || membership.role !== "COMPANY_ADMIN") {
    throw new Error("Недостаточно прав в этой компании");
  }
}

/** Any member (any role) can view the team; only COMPANY_ADMIN gets edit controls in the UI. */
export async function getMyCompanyTeam(companyId: string) {
  const user = await requireUser();
  const memberships = await companyAdminRepository.membershipsForUser(user.id);
  const myMembership = memberships.find((m) => m.companyId === companyId);
  if (!myMembership) return null;

  const company = await companyAdminRepository.byId(companyId);
  if (!company) return null;

  return { company, myRole: myMembership.role };
}

export async function inviteTeamMember(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const v = validate(teamInviteFormSchema, input);
  if (!v.success) return v.result;

  try {
    await requireCompanyAdmin(user.id, v.data.companyId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Недостаточно прав");
  }

  const found = await userAdminRepository.findByEmail(v.data.email.trim().toLowerCase());
  if (!found) {
    return fail("Пользователь с таким email не зарегистрирован в личном кабинете");
  }

  try {
    await companyAdminRepository.addMember(v.data.companyId, found.id, v.data.role);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateTeamMemberRole(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const v = validate(teamRoleFormSchema, input);
  if (!v.success) return v.result;

  try {
    await requireCompanyAdmin(user.id, v.data.companyId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Недостаточно прав");
  }

  const member = await companyAdminRepository.memberById(v.data.memberId);
  if (!member || member.companyId !== v.data.companyId) {
    return fail("Сотрудник не найден в этой компании");
  }

  if (member.role === "COMPANY_ADMIN" && v.data.role !== "COMPANY_ADMIN") {
    const company = await companyAdminRepository.byId(v.data.companyId);
    const adminCount = company?.members.filter((m) => m.role === "COMPANY_ADMIN").length ?? 0;
    if (adminCount <= 1) {
      return fail("В компании должен остаться хотя бы один администратор");
    }
  }

  try {
    await companyAdminRepository.updateMemberRole(v.data.memberId, v.data.role);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function removeTeamMember(companyId: string, memberId: string): Promise<ActionResult> {
  const user = await requireUser();

  try {
    await requireCompanyAdmin(user.id, companyId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Недостаточно прав");
  }

  const member = await companyAdminRepository.memberById(memberId);
  if (!member || member.companyId !== companyId) {
    return fail("Сотрудник не найден в этой компании");
  }

  if (member.role === "COMPANY_ADMIN") {
    const company = await companyAdminRepository.byId(companyId);
    const adminCount = company?.members.filter((m) => m.role === "COMPANY_ADMIN").length ?? 0;
    if (adminCount <= 1) {
      return fail("В компании должен остаться хотя бы один администратор");
    }
  }

  try {
    await companyAdminRepository.removeMember(memberId);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
