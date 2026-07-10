"use server";

import { revalidatePath } from "next/cache";

import { userAdminRepository } from "@/server/repositories/admin";
import { userFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";

function revalidate() {
  revalidatePath("/admin/users");
}

export async function createUser(input: unknown): Promise<ActionResult> {
  const v = validate(userFormSchema, input);
  if (!v.success) return v.result;
  try {
    await userAdminRepository.create({
      name: v.data.name || null,
      email: v.data.email,
      role: v.data.role,
      company: v.data.company || null,
      phone: v.data.phone || null,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateUser(id: string, input: unknown): Promise<ActionResult> {
  const v = validate(userFormSchema, input);
  if (!v.success) return v.result;
  try {
    await userAdminRepository.update(id, {
      name: v.data.name || null,
      email: v.data.email,
      role: v.data.role,
      company: v.data.company || null,
      phone: v.data.phone || null,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    await userAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
