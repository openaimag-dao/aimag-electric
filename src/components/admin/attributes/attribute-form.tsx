"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Field, Input, NativeSelect } from "@/components/admin/form-fields";
import { attributeFormSchema, type AttributeFormInput } from "@/lib/validations/admin";
import { createAttribute, updateAttribute } from "@/server/actions/admin";

export interface AttributeRow {
  id: string;
  key: string;
  name: string;
  type: "STRING" | "NUMBER" | "BOOLEAN";
  unit: string | null;
  filterable: boolean;
  order: number;
}

export function AttributeForm({ initial, onDone }: { initial?: AttributeRow; onDone: () => void }) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AttributeFormInput>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      key: initial?.key ?? "",
      name: initial?.name ?? "",
      type: initial?.type ?? "STRING",
      unit: initial?.unit ?? "",
      filterable: initial?.filterable ?? true,
      order: initial?.order ?? 0,
    },
  });

  async function onSubmit(values: AttributeFormInput) {
    const result = isEdit
      ? await updateAttribute(initial!.id, values)
      : await createAttribute(values);
    handleFormResult<AttributeFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Характеристика обновлена" : "Характеристика создана",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Название" htmlFor="name" error={errors.name}>
          <Input id="name" {...register("name")} />
        </Field>
        <Field label="Ключ" htmlFor="key" error={errors.key} hint="camelCase, латиница">
          <Input id="key" {...register("key")} disabled={isEdit} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Тип" htmlFor="type" error={errors.type}>
          <NativeSelect id="type" {...register("type")}>
            <option value="STRING">Текст</option>
            <option value="NUMBER">Число</option>
            <option value="BOOLEAN">Да/Нет</option>
          </NativeSelect>
        </Field>
        <Field label="Единица" htmlFor="unit" error={errors.unit} hint="напр. мм², кВ">
          <Input id="unit" {...register("unit")} />
        </Field>
        <Field label="Порядок" htmlFor="order" error={errors.order}>
          <Input id="order" type="number" {...register("order")} />
        </Field>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
        <div>
          <Label htmlFor="filterable">Показывать в фильтрах каталога</Label>
          <p className="text-xs text-muted-foreground">
            Секция фильтра появится только если у товаров есть значения.
          </p>
        </div>
        <Controller
          control={control}
          name="filterable"
          render={({ field }) => (
            <Switch id="filterable" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
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
