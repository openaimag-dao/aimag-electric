"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/admin/form-fields";
import { brandFormSchema, type BrandFormInput } from "@/lib/validations/admin";
import { createBrand, updateBrand } from "@/server/actions/admin";

export interface BrandRow {
  id: string;
  slug: string;
  name: string;
  origin: string | null;
}

export function BrandForm({
  initial,
  onDone,
}: {
  initial?: BrandRow;
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormInput>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      slug: initial?.slug ?? "",
      name: initial?.name ?? "",
      origin: initial?.origin ?? "",
    },
  });

  async function onSubmit(values: BrandFormInput) {
    const result = isEdit ? await updateBrand(initial!.id, values) : await createBrand(values);
    handleFormResult<BrandFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Производитель обновлён" : "Производитель создан",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label="Название" htmlFor="name" error={errors.name}>
        <Input id="name" {...register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" htmlFor="slug" error={errors.slug} hint="латиница, для URL">
          <Input id="slug" {...register("slug")} />
        </Field>
        <Field label="Происхождение" htmlFor="origin" error={errors.origin} hint="город, страна">
          <Input id="origin" {...register("origin")} />
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
