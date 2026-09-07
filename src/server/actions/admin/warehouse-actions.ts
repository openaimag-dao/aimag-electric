"use server";

import { revalidatePath } from "next/cache";

import { warehouseAdminRepository } from "@/server/repositories/admin";
import { warehouseFormSchema, stockQuantityFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";

function revalidate() {
  revalidatePath("/admin/warehouses");
}

export async function createWarehouse(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(warehouseFormSchema, input);
  if (!v.success) return v.result;
  try {
    const warehouse = await warehouseAdminRepository.create(v.data);
    await audit({
      action: "CREATE",
      entity: "Warehouse",
      entityId: warehouse.id,
      summary: `Склад создан: ${v.data.name}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateWarehouse(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(warehouseFormSchema, input);
  if (!v.success) return v.result;
  try {
    await warehouseAdminRepository.update(id, v.data);
    await audit({
      action: "UPDATE",
      entity: "Warehouse",
      entityId: id,
      summary: `Склад изменён: ${v.data.name}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteWarehouse(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await warehouseAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "Warehouse",
      entityId: id,
      summary: `Склад удалён (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateStockQuantity(
  warehouseId: string,
  stockId: string,
  input: unknown
): Promise<ActionResult> {
  await requireStaff();
  const v = validate(stockQuantityFormSchema, input);
  if (!v.success) return v.result;
  try {
    await warehouseAdminRepository.updateStockQuantity(stockId, v.data.quantity);
    await audit({
      action: "UPDATE",
      entity: "Stock",
      entityId: stockId,
      summary: `Остаток изменён: ${v.data.quantity}`,
      meta: { warehouseId },
    });
    revalidatePath(`/admin/warehouses/${warehouseId}`);
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
