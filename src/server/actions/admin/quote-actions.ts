"use server";

import { revalidatePath } from "next/cache";

import { quoteAdminRepository } from "@/server/repositories/admin";
import { quoteStatus } from "@/lib/validations/admin";
import { ok, fail, prismaError, type ActionResult } from "@/server/actions/action-result";

function revalidate() {
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}

export async function setQuoteStatus(id: string, status: string): Promise<ActionResult> {
  const parsed = quoteStatus.safeParse(status);
  if (!parsed.success) return fail("Некорректный статус");
  try {
    await quoteAdminRepository.updateStatus(id, parsed.data);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteQuote(id: string): Promise<ActionResult> {
  try {
    await quoteAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
