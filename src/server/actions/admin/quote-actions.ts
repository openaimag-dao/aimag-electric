"use server";

import { revalidatePath } from "next/cache";

import { quoteAdminRepository } from "@/server/repositories/admin";
import { quoteStatus } from "@/lib/validations/admin";
import { ok, fail, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { tengeToTiyn } from "@/lib/money";

function revalidate() {
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}

export async function setQuoteStatus(id: string, status: string): Promise<ActionResult> {
  await requireStaff();
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

/**
 * Sets the unit price staff quotes a line at — a quote's item price was
 * previously frozen at whatever the customer's cart showed on submission,
 * with no way for staff to adjust it before sending the КП.
 */
export async function updateQuoteItemPrice(
  itemId: string,
  priceTenge: number | null
): Promise<ActionResult> {
  await requireStaff();
  if (priceTenge !== null && (!Number.isFinite(priceTenge) || priceTenge < 0)) {
    return fail("Некорректная цена");
  }
  try {
    await quoteAdminRepository.updateItemPrice(
      itemId,
      priceTenge !== null ? tengeToTiyn(priceTenge) : null
    );
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteQuote(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await quoteAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
