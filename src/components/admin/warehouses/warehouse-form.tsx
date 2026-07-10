"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/admin/form-fields";
import { warehouseFormSchema, type WarehouseFormInput } from "@/lib/validations/admin";
import { createWarehouse, updateWarehouse } from "@/server/actions/admin";

export interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  city: string;
}

export function WarehouseForm({
  initial,
  onDone,
}: {
  initial?: WarehouseRow;
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormInput>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      city: initial?.city ?? "",
    },
  });

  async function onSubmit(values: WarehouseFormInput) {
    const result = isEdit ? await updateWarehouse(initial!.id, values) : await createWarehouse(values);
    handleFormResult<WarehouseFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Склад обновлён" : "Склад создан",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Код" htmlFor="code" error={errors.code} hint="напр. SHY">
          <Input id="code" {...register("code")} />
        </Field>
        <Field label="Город" htmlFor="city" error={errors.city}>
          <Input id="city" {...register("city")} />
        </Field>
      </div>
      <Field label="Название" htmlFor="name" error={errors.name}>
        <Input id="name" {...register("name")} />
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
