"use server";

import { revalidatePath } from "next/cache";

import { warehouseAdminRepository } from "@/server/repositories/admin";
import { warehouseFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";

function revalidate() {
  revalidatePath("/admin/warehouses");
}

export async function createWarehouse(input: unknown): Promise<ActionResult> {
  const v = validate(warehouseFormSchema, input);
  if (!v.success) return v.result;
  try {
    await warehouseAdminRepository.create(v.data);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateWarehouse(id: string, input: unknown): Promise<ActionResult> {
  const v = validate(warehouseFormSchema, input);
  if (!v.success) return v.result;
  try {
    await warehouseAdminRepository.update(id, v.data);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteWarehouse(id: string): Promise<ActionResult> {
  try {
    await warehouseAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
