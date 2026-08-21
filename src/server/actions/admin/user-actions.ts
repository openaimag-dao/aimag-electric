"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

import { userAdminRepository } from "@/server/repositories/admin";
import { userFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";

function revalidate() {
  revalidatePath("/admin/users");
}

export async function createUser(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(userFormSchema, input);
  if (!v.success) return v.result;
  try {
    await userAdminRepository.create({
      name: v.data.name || null,
      email: v.data.email,
      role: v.data.role,
      company: v.data.company || null,
      phone: v.data.phone || null,
      passwordHash: v.data.password ? await hash(v.data.password, 10) : null,
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
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
