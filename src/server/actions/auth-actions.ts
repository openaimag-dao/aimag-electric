"use server";

import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";

export async function registerUser(input: unknown): Promise<ActionResult> {
  const v = validate(registerSchema, input);
  if (!v.success) return v.result;

  const existing = await prisma.user.findUnique({ where: { email: v.data.email } });
  if (existing) {
    return fail("Пользователь с таким e-mail уже зарегистрирован", {
      email: "Уже зарегистрирован — войдите в личный кабинет",
    });
  }

  try {
    const passwordHash = await hash(v.data.password, 10);
    await prisma.user.create({
      data: {
        name: v.data.name,
        email: v.data.email,
        company: v.data.company || null,
        phone: v.data.phone || null,
        passwordHash,
        role: "CUSTOMER",
      },
    });
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
