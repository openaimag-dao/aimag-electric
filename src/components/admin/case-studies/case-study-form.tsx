"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, Input, Textarea } from "@/components/admin/form-fields";
import { Label } from "@/components/ui/label";
import { caseStudyFormSchema, type CaseStudyFormInput } from "@/lib/validations/admin";
import { createCaseStudy, updateCaseStudy } from "@/server/actions/admin";

export interface CaseStudyRow {
  id: string;
  slug: string;
  title: string;
  scope: string;
  description: string | null;
  location: string;
  year: string;
  metric: string;
  metricLabel: string;
  category: string;
  order: number;
  published: boolean;
}

export function CaseStudyForm({ initial, onDone }: { initial?: CaseStudyRow; onDone: () => void }) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CaseStudyFormInput>({
    resolver: zodResolver(caseStudyFormSchema),
    defaultValues: {
      slug: initial?.slug ?? "",
      title: initial?.title ?? "",
      scope: initial?.scope ?? "",
      description: initial?.description ?? "",
      location: initial?.location ?? "",
      year: initial?.year ?? "",
      metric: initial?.metric ?? "",
      metricLabel: initial?.metricLabel ?? "",
      category: initial?.category ?? "",
      order: initial?.order ?? 0,
      published: initial?.published ?? true,
    },
  });

  async function onSubmit(values: CaseStudyFormInput) {
    const result = isEdit
      ? await updateCaseStudy(initial!.id, values)
      : await createCaseStudy(values);
    handleFormResult<CaseStudyFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Проект обновлён" : "Проект создан",
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
        <Field
          label="Отрасль"
          htmlFor="category"
          error={errors.category}
          hint="Энергетика, Транспорт…"
        >
          <Input id="category" {...register("category")} />
        </Field>
      </div>

      <Field
        label="Суть поставки"
        htmlFor="scope"
        error={errors.scope}
        hint="показывается в карточке"
      >
        <Textarea id="scope" rows={2} {...register("scope")} />
      </Field>

      <Field
        label="Подробное описание"
        htmlFor="description"
        error={errors.description}
        hint="для страницы проекта, необязательно"
      >
        <Textarea id="description" rows={6} {...register("description")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Регион" htmlFor="location" error={errors.location}>
          <Input id="location" {...register("location")} />
        </Field>
        <Field label="Год" htmlFor="year" error={errors.year}>
          <Input id="year" {...register("year")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Показатель" htmlFor="metric" error={errors.metric} hint="42 км, 6, 3,2 МВт">
          <Input id="metric" {...register("metric")} />
        </Field>
        <Field label="Подпись показателя" htmlFor="metricLabel" error={errors.metricLabel}>
          <Input id="metricLabel" {...register("metricLabel")} />
        </Field>
        <Field label="Порядок" htmlFor="order" error={errors.order}>
          <Input id="order" type="number" {...register("order")} />
        </Field>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
        <div>
          <Label htmlFor="published">Опубликован</Label>
          <p className="text-xs text-muted-foreground">Скрытые проекты не показываются на сайте.</p>
        </div>
        <Controller
          control={control}
          name="published"
          render={({ field }) => (
            <Switch id="published" checked={field.value} onCheckedChange={field.onChange} />
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
