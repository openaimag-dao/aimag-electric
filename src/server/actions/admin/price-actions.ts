"use server";

import { revalidatePath } from "next/cache";

import { priceAdminRepository } from "@/server/repositories/admin";
import { priceFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { tengeToTiyn } from "@/lib/money";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";

function revalidate() {
  revalidatePath("/admin/prices");
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

// Форма принимает тенге; в БД цена хранится в тиынах (×100).
function amountTiyn(amountTenge: number | "" | undefined): number | null {
  if (amountTenge === "" || amountTenge === undefined) return null;
  return tengeToTiyn(amountTenge);
}

export async function createPrice(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(priceFormSchema, input);
  if (!v.success) return v.result;
  try {
    const price = await priceAdminRepository.create({
      kind: v.data.kind,
      amount: amountTiyn(v.data.amountTenge),
      minQty: v.data.minQty,
      product: { connect: { id: v.data.productId } },
    });
    await audit({
      action: "CREATE",
      entity: "Price",
      entityId: price.id,
      summary: `Цена (${v.data.kind}) добавлена для товара ${v.data.productId}`,
      meta: { productId: v.data.productId, kind: v.data.kind, amountTenge: v.data.amountTenge },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updatePrice(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(priceFormSchema, input);
  if (!v.success) return v.result;
  try {
    await priceAdminRepository.update(id, {
      kind: v.data.kind,
      amount: amountTiyn(v.data.amountTenge),
      minQty: v.data.minQty,
      product: { connect: { id: v.data.productId } },
    });
    await audit({
      action: "UPDATE",
      entity: "Price",
      entityId: id,
      summary: `Цена (${v.data.kind}) изменена для товара ${v.data.productId}`,
      meta: { productId: v.data.productId, kind: v.data.kind, amountTenge: v.data.amountTenge },
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

/**
 * Adjusts the BASE price of every selected product by a percentage in one
 * shot — the bulk toolbar's price control. A percentage, not an absolute
 * value: a bulk-selected set typically spans very differently priced
 * products (a cable at 500 ₸/м next to a cabinet at 500 000 ₸), so "set
 * price to X" would be meaningless across the whole selection the way it is
 * for category/brand/status. For an arbitrary set of new absolute prices,
 * the existing XLSX export → edit → import path already covers it.
 */
export async function bulkAdjustProductPrices(
  ids: string[],
  percent: number
): Promise<ActionResult<{ count: number }>> {
  await requireStaff();
  if (ids.length === 0) return fail("Не выбрано ни одного товара");
  if (!Number.isFinite(percent) || percent === 0) return fail("Укажите процент изменения");
  if (percent <= -100) return fail("Изменение не может обнулить или сделать цену отрицательной");
  try {
    const result = await priceAdminRepository.bulkAdjustBasePrice(ids, percent);
    await audit({
      action: "UPDATE",
      entity: "Price",
      summary: `Массовое изменение цены: ${result.count} товар(ов), ${percent > 0 ? "+" : ""}${percent}%`,
      meta: { ids, percent },
    });
    revalidate();
    return ok({ count: result.count });
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deletePrice(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await priceAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "Price",
      entityId: id,
      summary: `Цена удалена (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
