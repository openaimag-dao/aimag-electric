"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, NativeSelect } from "@/components/admin/form-fields";
import { categoryFormSchema, type CategoryFormInput } from "@/lib/validations/admin";
import { createCategory, updateCategory } from "@/server/actions/admin";

const ICON_OPTIONS = [
  "Cable", "Zap", "Shield", "Link2", "Combine", "ToggleRight", "Factory",
];

export interface CategoryRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  spec: string | null;
  icon: string | null;
  order: number;
}

export function CategoryForm({
  initial,
  onDone,
}: {
  initial?: CategoryRow;
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      slug: initial?.slug ?? "",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      spec: initial?.spec ?? "",
      icon: initial?.icon ?? "",
      order: initial?.order ?? 0,
    },
  });

  async function onSubmit(values: CategoryFormInput) {
    const result = isEdit ? await updateCategory(initial!.id, values) : await createCategory(values);
    handleFormResult<CategoryFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Категория обновлена" : "Категория создана",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label="Название" htmlFor="title" error={errors.title}>
        <Input id="title" {...register("title")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" htmlFor="slug" error={errors.slug} hint="латиница, для URL">
          <Input id="slug" {...register("slug")} />
        </Field>
        <Field label="Порядок" htmlFor="order" error={errors.order}>
          <Input id="order" type="number" {...register("order")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Тех. метка" htmlFor="spec" error={errors.spec} hint="напр. 0,66–35 кВ">
          <Input id="spec" {...register("spec")} />
        </Field>
        <Field label="Иконка" htmlFor="icon" error={errors.icon}>
          <NativeSelect id="icon" {...register("icon")}>
            <option value="">— нет —</option>
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Описание" htmlFor="description" error={errors.description}>
        <Textarea id="description" {...register("description")} />
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
