"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, NativeSelect } from "@/components/admin/form-fields";
import { customerFormSchema, type CustomerFormInput } from "@/lib/validations/crm";
import { createCustomer, updateCustomer } from "@/server/actions/admin";
import { handleFormResult } from "@/lib/admin/form-submit";

export interface CustomerRow {
  id: string;
  company: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  bin: string | null;
  notes: string | null;
  status: string;
  ownerId: string | null;
}

interface Ref {
  id: string;
  label: string;
}

export function CustomerForm({
  initial,
  managers,
  onDone,
}: {
  initial?: CustomerRow;
  managers: Ref[];
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      company: initial?.company ?? "",
      contact: initial?.contact ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      city: initial?.city ?? "",
      bin: initial?.bin ?? "",
      notes: initial?.notes ?? "",
      status: (initial?.status as CustomerFormInput["status"]) ?? "LEAD",
      ownerId: initial?.ownerId ?? "",
    },
  });

  async function onSubmit(values: CustomerFormInput) {
    const result = isEdit
      ? await updateCustomer(initial!.id, values)
      : await createCustomer(values);
    handleFormResult<CustomerFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Клиент обновлён" : "Клиент создан",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label="Компания" htmlFor="company" error={errors.company}>
        <Input id="company" {...register("company")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Контактное лицо" htmlFor="contact" error={errors.contact}>
          <Input id="contact" {...register("contact")} />
        </Field>
        <Field label="Телефон" htmlFor="phone" error={errors.phone}>
          <Input id="phone" {...register("phone")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
        <Field label="Город" htmlFor="city" error={errors.city}>
          <Input id="city" {...register("city")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="БИН/ИИН" htmlFor="bin" error={errors.bin}>
          <Input id="bin" {...register("bin")} />
        </Field>
        <Field label="Статус" htmlFor="status" error={errors.status}>
          <NativeSelect id="status" {...register("status")}>
            <option value="LEAD">Лид</option>
            <option value="ACTIVE">Активный</option>
            <option value="INACTIVE">Неактивный</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Ответственный менеджер" htmlFor="ownerId" error={errors.ownerId}>
        <NativeSelect id="ownerId" {...register("ownerId")}>
          <option value="">— не назначен —</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </NativeSelect>
      </Field>
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
