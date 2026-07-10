"use server";

import { revalidatePath } from "next/cache";

import { priceAdminRepository } from "@/server/repositories/admin";
import { priceFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { tengeToTiyn } from "@/lib/money";

function revalidate() {
  revalidatePath("/admin/prices");
  revalidatePath("/catalog");
}

// Форма принимает тенге; в БД цена хранится в тиынах (×100).
function amountTiyn(amountTenge: number | "" | undefined): number | null {
  if (amountTenge === "" || amountTenge === undefined) return null;
  return tengeToTiyn(amountTenge);
}

export async function createPrice(input: unknown): Promise<ActionResult> {
  const v = validate(priceFormSchema, input);
  if (!v.success) return v.result;
  try {
    await priceAdminRepository.create({
      kind: v.data.kind,
      amount: amountTiyn(v.data.amountTenge),
      minQty: v.data.minQty,
      product: { connect: { id: v.data.productId } },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updatePrice(id: string, input: unknown): Promise<ActionResult> {
  const v = validate(priceFormSchema, input);
  if (!v.success) return v.result;
  try {
    await priceAdminRepository.update(id, {
      kind: v.data.kind,
      amount: amountTiyn(v.data.amountTenge),
      minQty: v.data.minQty,
      product: { connect: { id: v.data.productId } },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deletePrice(id: string): Promise<ActionResult> {
  try {
    await priceAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
