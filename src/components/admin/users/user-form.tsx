"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/admin/form-fields";
import { userFormSchema, type UserFormInput } from "@/lib/validations/admin";
import { createUser, updateUser } from "@/server/actions/admin";

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  company: string | null;
  phone: string | null;
}

export function UserForm({
  initial, onDone,
}: {
  initial?: UserRow;
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register, handleSubmit, setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      role: (initial?.role as UserFormInput["role"]) ?? "CUSTOMER",
      company: initial?.company ?? "",
      phone: initial?.phone ?? "",
    },
  });

  async function onSubmit(values: UserFormInput) {
    const result = isEdit ? await updateUser(initial!.id, values) : await createUser(values);
    handleFormResult<UserFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Пользователь обновлён" : "Пользователь создан",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Имя" htmlFor="name" error={errors.name}>
          <Input id="name" {...register("name")} />
        </Field>
        <Field label="E-mail" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Роль" htmlFor="role" error={errors.role}>
          <NativeSelect id="role" {...register("role")}>
            <option value="CUSTOMER">Клиент</option>
            <option value="MANAGER">Менеджер</option>
            <option value="ADMIN">Администратор</option>
          </NativeSelect>
        </Field>
        <Field label="Телефон" htmlFor="phone" error={errors.phone}>
          <Input id="phone" {...register("phone")} />
        </Field>
      </div>
      <Field label="Компания" htmlFor="company" error={errors.company}>
        <Input id="company" {...register("company")} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>Отмена</Button>
        <Button type="submit" variant="signal" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
