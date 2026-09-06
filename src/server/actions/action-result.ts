import type { z } from "zod";

export interface ActionResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Validate input with a Zod schema, returning flattened field errors on failure. */
export function validate<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown
): { success: true; data: z.infer<S> } | { success: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };
  const flat = parsed.error.flatten().fieldErrors as Record<string, string[]>;
  const fieldErrors = Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ""]));
  return { success: false, result: fail("Проверьте заполнение формы", fieldErrors) };
}

/** Map common Prisma error codes to friendly messages. */
export function prismaError(e: unknown): string {
  const code = (e as { code?: string })?.code;
  if (code === "P2002") return "Запись с таким уникальным полем уже существует";
  if (code === "P2003") return "Нельзя выполнить: есть связанные записи";
  if (code === "P2025") return "Запись не найдена";
  return "Произошла ошибка. Попробуйте позже.";
}

/**
 * Normalizes an unknown thrown value into a user-facing ActionResult.
 * Recognizes auth errors by name so RBAC failures degrade gracefully instead
 * of bubbling up as unhandled 500s.
 */
export function toActionError(e: unknown): ActionResult<never> {
  const name = (e as { name?: string })?.name;
  if (name === "AuthenticationError") return fail("Требуется вход в систему");
  if (name === "AuthorizationError") return fail("Недостаточно прав для этого действия");
  if ((e as { code?: string })?.code) return fail(prismaError(e));
  return fail("Произошла ошибка. Попробуйте позже.");
}
