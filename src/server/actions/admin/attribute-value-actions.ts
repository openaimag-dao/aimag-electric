"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import {
  attributeAdminRepository,
  attributeValueAdminRepository,
} from "@/server/repositories/admin";
import { attributeValueFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";

function revalidate() {
  revalidatePath("/admin/attribute-values");
  revalidatePath("/catalog");
}

/** The form always collects a plain string; store it in the column that matches the attribute's declared type. */
function typedColumns(
  type: "STRING" | "NUMBER" | "BOOLEAN",
  raw: string
): Pick<Prisma.AttributeValueUncheckedCreateInput, "valueString" | "valueNumber" | "valueBool"> {
  if (type === "NUMBER") {
    const n = Number(raw);
    if (Number.isNaN(n)) throw new Error("Значение должно быть числом");
    return { valueString: null, valueNumber: n, valueBool: null };
  }
  if (type === "BOOLEAN") {
    return {
      valueString: null,
      valueNumber: null,
      valueBool: ["1", "true", "да", "yes"].includes(raw.toLowerCase()),
    };
  }
  return { valueString: raw, valueNumber: null, valueBool: null };
}

export async function createAttributeValue(input: unknown): Promise<ActionResult> {
  const v = validate(attributeValueFormSchema, input);
  if (!v.success) return v.result;
  try {
    const attribute = await attributeAdminRepository.byId(v.data.attributeId);
    if (!attribute) return fail("Характеристика не найдена");
    await attributeValueAdminRepository.create({
      product: { connect: { id: v.data.productId } },
      attribute: { connect: { id: v.data.attributeId } },
      ...typedColumns(attribute.type, v.data.value),
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(
      e instanceof Error && e.message === "Значение должно быть числом" ? e.message : prismaError(e)
    );
  }
}

export async function updateAttributeValue(id: string, input: unknown): Promise<ActionResult> {
  const v = validate(attributeValueFormSchema, input);
  if (!v.success) return v.result;
  try {
    const attribute = await attributeAdminRepository.byId(v.data.attributeId);
    if (!attribute) return fail("Характеристика не найдена");
    await attributeValueAdminRepository.update(id, {
      product: { connect: { id: v.data.productId } },
      attribute: { connect: { id: v.data.attributeId } },
      ...typedColumns(attribute.type, v.data.value),
    });
    revalidate();
    return ok();
  } catch (e) {
    return fail(
      e instanceof Error && e.message === "Значение должно быть числом" ? e.message : prismaError(e)
    );
  }
}

export async function deleteAttributeValue(id: string): Promise<ActionResult> {
  try {
    await attributeValueAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
