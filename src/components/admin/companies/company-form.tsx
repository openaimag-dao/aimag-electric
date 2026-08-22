"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/admin/form-fields";
import { companyFormSchema, type CompanyFormInput } from "@/lib/validations/admin";
import { createCompany, updateCompany } from "@/server/actions/admin";

export interface CompanyRow {
  id: string;
  name: string;
  bin: string | null;
  legalAddress: string | null;
  actualAddress: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export function CompanyForm({ initial, onDone }: { initial?: CompanyRow; onDone: () => void }) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormInput>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      bin: initial?.bin ?? "",
      legalAddress: initial?.legalAddress ?? "",
      actualAddress: initial?.actualAddress ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: CompanyFormInput) {
    const result = isEdit ? await updateCompany(initial!.id, values) : await createCompany(values);
    handleFormResult<CompanyFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Компания обновлена" : "Компания создана",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label="Название" htmlFor="name" error={errors.name}>
        <Input id="name" {...register("name")} />
      </Field>
      <Field label="БИН" htmlFor="bin" error={errors.bin} hint="12 цифр">
        <Input id="bin" {...register("bin")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Юридический адрес" htmlFor="legalAddress" error={errors.legalAddress}>
          <Input id="legalAddress" {...register("legalAddress")} />
        </Field>
        <Field label="Фактический адрес" htmlFor="actualAddress" error={errors.actualAddress}>
          <Input id="actualAddress" {...register("actualAddress")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Телефон" htmlFor="phone" error={errors.phone}>
          <Input id="phone" {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
      </div>
      <Field label="Заметки" htmlFor="notes" error={errors.notes}>
        <Textarea id="notes" rows={3} {...register("notes")} />
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
