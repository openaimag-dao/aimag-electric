"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/admin/form-fields";
import { projectFormSchema, type ProjectFormInput } from "@/lib/validations/project";
import { createProject, updateProject } from "@/server/actions/project-actions";

export interface ProjectFields {
  id: string;
  title: string;
  description: string | null;
  objectName: string | null;
  region: string | null;
  deadline: string | null;
}

export function ProjectForm({
  initial,
  onDone,
  onCreated,
}: {
  initial?: ProjectFields;
  onDone: () => void;
  /** Called with the new project's id right after a successful create. */
  onCreated?: (id: string) => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      objectName: initial?.objectName ?? "",
      region: initial?.region ?? "",
      deadline: initial?.deadline ? initial.deadline.slice(0, 10) : "",
    },
  });

  async function onSubmit(values: ProjectFormInput) {
    const result = isEdit ? await updateProject(initial!.id, values) : await createProject(values);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось сохранить проект");
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof ProjectFormInput, { message });
        }
      }
      return;
    }
    toast.success(isEdit ? "Проект обновлён" : "Проект создан");
    if (!isEdit && "data" in result && result.data) onCreated?.(result.data.id);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label="Название" htmlFor="title" error={errors.title}>
        <Input id="title" {...register("title")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Объект" htmlFor="objectName" error={errors.objectName}>
          <Input id="objectName" {...register("objectName")} />
        </Field>
        <Field label="Регион" htmlFor="region" error={errors.region}>
          <Input id="region" {...register("region")} />
        </Field>
      </div>
      <Field label="Срок" htmlFor="deadline" error={errors.deadline}>
        <Input id="deadline" type="date" {...register("deadline")} />
      </Field>
      <Field label="Описание" htmlFor="description" error={errors.description}>
        <Textarea id="description" rows={3} {...register("description")} />
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
