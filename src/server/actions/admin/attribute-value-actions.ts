"use server";

import { revalidatePath } from "next/cache";

import {
  attributeAdminRepository,
  attributeValueAdminRepository,
  categoryAttributeRepository,
  productAdminRepository,
} from "@/server/repositories/admin";
import { attributeValueFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { coerceAttributeValue, type AttributeValueType } from "@/lib/attributes";

function revalidate() {
  revalidatePath("/admin/attribute-values");
  revalidatePath("/catalog");
}

/** The form always collects a plain string; store it in the column that matches the attribute's declared type. */
function typedColumns(type: "STRING" | "NUMBER" | "BOOLEAN", raw: string) {
  const coerced = coerceAttributeValue(type, raw);
  if (!coerced) throw new Error("Значение должно быть числом");
  return coerced;
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

export interface ProductSpecField {
  attributeId: string;
  name: string;
  unit: string | null;
  type: AttributeValueType;
  required: boolean;
  value: string;
  valueId: string | null;
}

function attributeValueToString(
  type: AttributeValueType,
  v:
    | { valueString: string | null; valueNumber: number | null; valueBool: boolean | null }
    | undefined
) {
  if (!v) return "";
  if (type === "NUMBER") return v.valueNumber != null ? String(v.valueNumber) : "";
  if (type === "BOOLEAN") return v.valueBool ? "да" : "нет";
  return v.valueString ?? "";
}

/**
 * Product-edit-form spec fields: the category's attribute template (required
 * ones first, per its saved order), pre-filled from any existing values —
 * plus any extra values on the product that aren't part of the template
 * (e.g. set via import) so nothing already saved is hidden.
 */
export async function getProductSpecFields(
  productId: string
): Promise<ActionResult<ProductSpecField[]>> {
  try {
    const product = await productAdminRepository.byId(productId);
    if (!product) return fail("Товар не найден");

    const template = await categoryAttributeRepository.listForCategory(product.categoryId);
    const valueByAttributeId = new Map(product.values.map((v) => [v.attributeId, v]));
    const templateAttributeIds = new Set(template.map((t) => t.attributeId));

    const templated: ProductSpecField[] = template.map((t) => {
      const existing = valueByAttributeId.get(t.attributeId);
      return {
        attributeId: t.attributeId,
        name: t.attribute.name,
        unit: t.attribute.unit,
        type: t.attribute.type,
        required: t.required,
        value: attributeValueToString(t.attribute.type, existing),
        valueId: existing?.id ?? null,
      };
    });

    const extra: ProductSpecField[] = product.values
      .filter((v) => !templateAttributeIds.has(v.attributeId))
      .map((v) => ({
        attributeId: v.attributeId,
        name: v.attribute.name,
        unit: v.attribute.unit,
        type: v.attribute.type,
        required: false,
        value: attributeValueToString(v.attribute.type, v),
        valueId: v.id,
      }));

    return ok([...templated, ...extra]);
  } catch (e) {
    return fail(prismaError(e));
  }
}

export interface ProductSpecFieldInput {
  attributeId: string;
  type: AttributeValueType;
  value: string;
  valueId: string | null;
}

/** Saves all spec fields from the product form's inline panel in one go. */
export async function saveProductSpecs(
  productId: string,
  fields: ProductSpecFieldInput[]
): Promise<ActionResult> {
  try {
    for (const f of fields) {
      const trimmed = f.value.trim();
      if (!trimmed) {
        if (f.valueId) await attributeValueAdminRepository.remove(f.valueId);
        continue;
      }
      const coerced = coerceAttributeValue(f.type, trimmed);
      if (!coerced) return fail(`Некорректное значение для одной из числовых характеристик`);
      if (f.valueId) {
        await attributeValueAdminRepository.update(f.valueId, {
          product: { connect: { id: productId } },
          attribute: { connect: { id: f.attributeId } },
          ...coerced,
        });
      } else {
        await attributeValueAdminRepository.create({
          product: { connect: { id: productId } },
          attribute: { connect: { id: f.attributeId } },
          ...coerced,
        });
      }
    }
    revalidate();
    revalidatePath("/admin/products");
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
