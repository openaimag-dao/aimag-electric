"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

import { userAdminRepository } from "@/server/repositories/admin";
import { userFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";

function revalidate() {
  revalidatePath("/admin/users");
}

export async function createUser(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(userFormSchema, input);
  if (!v.success) return v.result;
  try {
    const user = await userAdminRepository.create({
      name: v.data.name || null,
      email: v.data.email,
      role: v.data.role,
      company: v.data.company || null,
      phone: v.data.phone || null,
      passwordHash: v.data.password ? await hash(v.data.password, 10) : null,
    });
    // Never include the password/hash in the audit meta — role and email are
    // the security-relevant fields, the credential itself is not audit data.
    await audit({
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      summary: `Пользователь создан: ${v.data.email} (${v.data.role})`,
      meta: { email: v.data.email, role: v.data.role },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateUser(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(userFormSchema, input);
  if (!v.success) return v.result;
  try {
    await userAdminRepository.update(id, {
      name: v.data.name || null,
      email: v.data.email,
      role: v.data.role,
      company: v.data.company || null,
      phone: v.data.phone || null,
      // Blank password field on edit means "keep current password" — never
      // silently clear an existing hash just because the field was left empty.
      ...(v.data.password ? { passwordHash: await hash(v.data.password, 10) } : {}),
    });
    await audit({
      action: "UPDATE",
      entity: "User",
      entityId: id,
      summary: `Пользователь изменён: ${v.data.email} (${v.data.role})${v.data.password ? ", пароль сброшен" : ""}`,
      meta: { email: v.data.email, role: v.data.role, passwordReset: Boolean(v.data.password) },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await userAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "User",
      entityId: id,
      summary: `Пользователь удалён (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
