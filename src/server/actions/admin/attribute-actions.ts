"use server";

import { revalidatePath } from "next/cache";

import { attributeAdminRepository } from "@/server/repositories/admin";
import { attributeFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { audit } from "@/server/audit";

function revalidate() {
  revalidatePath("/admin/attributes");
  revalidatePath("/admin/attribute-values");
  revalidatePath("/catalog");
}

export async function createAttribute(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(attributeFormSchema, input);
  if (!v.success) return v.result;
  try {
    const attribute = await attributeAdminRepository.create({
      key: v.data.key,
      name: v.data.name,
      type: v.data.type,
      unit: v.data.unit || null,
      filterable: v.data.filterable,
      order: v.data.order,
    });
    await audit({
      action: "CREATE",
      entity: "Attribute",
      entityId: attribute.id,
      summary: `Характеристика создана: ${v.data.name}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateAttribute(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(attributeFormSchema, input);
  if (!v.success) return v.result;
  try {
    await attributeAdminRepository.update(id, {
      key: v.data.key,
      name: v.data.name,
      type: v.data.type,
      unit: v.data.unit || null,
      filterable: v.data.filterable,
      order: v.data.order,
    });
    await audit({
      action: "UPDATE",
      entity: "Attribute",
      entityId: id,
      summary: `Характеристика изменена: ${v.data.name}`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteAttribute(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    const count = await attributeAdminRepository.countValues(id);
    if (count > 0) {
      return fail(
        `Нельзя удалить: характеристика задана у ${count} товаров. Сначала удалите значения.`
      );
    }
    await attributeAdminRepository.remove(id);
    await audit({
      action: "DELETE",
      entity: "Attribute",
      entityId: id,
      summary: `Характеристика удалена (${id})`,
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
