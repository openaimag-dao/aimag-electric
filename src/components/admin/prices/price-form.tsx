"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/admin/form-fields";
import { priceFormSchema, type PriceFormInput } from "@/lib/validations/admin";
import { createPrice, updatePrice } from "@/server/actions/admin";

export interface PriceRow {
  id: string;
  productId: string;
  kind: string;
  amountTenge: number | "";
  minQty: number;
}

interface Ref {
  id: string;
  label: string;
}

export function PriceForm({
  initial,
  products,
  onDone,
}: {
  initial?: PriceRow;
  products: Ref[];
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PriceFormInput>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      productId: initial?.productId ?? "",
      kind: (initial?.kind as PriceFormInput["kind"]) ?? "BASE",
      amountTenge: initial?.amountTenge ?? "",
      minQty: initial?.minQty ?? 1,
    },
  });

  async function onSubmit(values: PriceFormInput) {
    const result = isEdit ? await updatePrice(initial!.id, values) : await createPrice(values);
    handleFormResult<PriceFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Цена обновлена" : "Цена добавлена",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label="Товар" htmlFor="productId" error={errors.productId}>
        <NativeSelect id="productId" {...register("productId")}>
          <option value="">— выберите —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Тип" htmlFor="kind" error={errors.kind}>
          <NativeSelect id="kind" {...register("kind")}>
            <option value="BASE">Базовая</option>
            <option value="WHOLESALE">Оптовая</option>
            <option value="PROMO">Акция</option>
          </NativeSelect>
        </Field>
        <Field label="Цена, ₸" htmlFor="amountTenge" error={errors.amountTenge} hint="пусто = по запросу">
          <Input id="amountTenge" type="number" step="0.01" {...register("amountTenge")} />
        </Field>
        <Field label="От кол-ва" htmlFor="minQty" error={errors.minQty}>
          <Input id="minQty" type="number" step="0.01" {...register("minQty")} />
        </Field>
      </div>
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
