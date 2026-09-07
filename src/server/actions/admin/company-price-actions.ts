"use server";

import { revalidatePath } from "next/cache";

import { companyPriceAdminRepository } from "@/server/repositories/admin";
import { ok, fail, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";
import { tengeToTiyn } from "@/lib/money";

function revalidate(companyId: string) {
  revalidatePath(`/admin/companies/${companyId}`);
}

function validPrice(priceTenge: number): string | null {
  if (!Number.isFinite(priceTenge) || priceTenge < 0) return "Некорректная цена";
  return null;
}

export async function createCompanyPrice(
  companyId: string,
  productId: string,
  priceTenge: number
): Promise<ActionResult> {
  await requireStaff();
  if (!productId) return fail("Укажите товар");
  const error = validPrice(priceTenge);
  if (error) return fail(error);
  try {
    const price = await companyPriceAdminRepository.create({
      company: { connect: { id: companyId } },
      product: { connect: { id: productId } },
      amountTiyn: tengeToTiyn(priceTenge),
    });
    await audit({
      action: "CREATE",
      entity: "CompanyPrice",
      entityId: price.id,
      summary: `Индивидуальная цена добавлена: товар ${productId}`,
      meta: { companyId, productId, priceTenge },
    });
    revalidate(companyId);
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateCompanyPrice(
  id: string,
  companyId: string,
  priceTenge: number
): Promise<ActionResult> {
  await requireStaff();
  const error = validPrice(priceTenge);
  if (error) return fail(error);
  try {
    await companyPriceAdminRepository.update(id, tengeToTiyn(priceTenge));
    await audit({
      action: "UPDATE",
      entity: "CompanyPrice",
      entityId: id,
      summary: `Индивидуальная цена изменена`,
      meta: { companyId, priceTenge },
    });
    revalidate(companyId);
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteCompanyPrice(id: string, companyId: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await companyPriceAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "CompanyPrice",
      entityId: id,
      summary: `Индивидуальная цена удалена (${id})`,
      meta: { companyId },
    });
    revalidate(companyId);
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
