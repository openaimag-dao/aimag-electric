"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/admin/form-fields";
import { attributeValueFormSchema, type AttributeValueFormInput } from "@/lib/validations/admin";
import { createAttributeValue, updateAttributeValue } from "@/server/actions/admin";

export interface AttributeValueRow {
  id: string;
  productId: string;
  attributeId: string;
  value: string;
}

interface ProductRef {
  id: string;
  label: string;
}

interface AttributeRef {
  id: string;
  label: string;
  unit: string | null;
}

export function AttributeValueForm({
  initial,
  products,
  attributes,
  onDone,
}: {
  initial?: AttributeValueRow;
  products: ProductRef[];
  attributes: AttributeRef[];
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AttributeValueFormInput>({
    resolver: zodResolver(attributeValueFormSchema),
    defaultValues: {
      productId: initial?.productId ?? "",
      attributeId: initial?.attributeId ?? "",
      value: initial?.value ?? "",
    },
  });

  const selectedAttribute = attributes.find((a) => a.id === watch("attributeId"));

  async function onSubmit(values: AttributeValueFormInput) {
    const result = isEdit
      ? await updateAttributeValue(initial!.id, values)
      : await createAttributeValue(values);
    handleFormResult<AttributeValueFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Значение обновлено" : "Значение добавлено",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label="Товар" htmlFor="productId" error={errors.productId}>
        <NativeSelect id="productId" {...register("productId")}>
          <option value="">— выберите —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Характеристика" htmlFor="attributeId" error={errors.attributeId}>
        <NativeSelect id="attributeId" {...register("attributeId")}>
          <option value="">— выберите —</option>
          {attributes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field
        label="Значение"
        htmlFor="value"
        error={errors.value}
        hint={selectedAttribute?.unit ?? undefined}
      >
        <Input id="value" {...register("value")} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" variant="signal" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
