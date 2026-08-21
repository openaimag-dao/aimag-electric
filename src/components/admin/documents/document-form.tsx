"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/admin/form-fields";
import { documentFormSchema, type DocumentFormInput } from "@/lib/validations/admin";
import { createDocument, updateDocument, uploadDocumentFile } from "@/server/actions/admin";

export interface DocumentRow {
  id: string;
  productId: string;
  title: string;
  kind: string;
  url: string;
  size: string | null;
  order: number;
}

interface Ref {
  id: string;
  label: string;
}

export function DocumentForm({
  initial,
  products,
  onDone,
}: {
  initial?: DocumentRow;
  products: Ref[];
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormInput>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      productId: initial?.productId ?? "",
      title: initial?.title ?? "",
      kind: (initial?.kind as DocumentFormInput["kind"]) ?? "DATASHEET",
      url: initial?.url ?? "",
      size: initial?.size ?? "",
      order: initial?.order ?? 0,
    },
  });

  async function onSubmit(values: DocumentFormInput) {
    const result = isEdit
      ? await updateDocument(initial!.id, values)
      : await createDocument(values);
    handleFormResult<DocumentFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Документ обновлён" : "Документ добавлен",
    });
  }

  const [uploading, setUploading] = React.useState(false);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadDocumentFile(formData);
    setUploading(false);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Не удалось загрузить файл");
      return;
    }
    setValue("url", result.data.url, { shouldValidate: true });
    setValue("size", result.data.size, { shouldValidate: true });
    toast.success("Файл загружен");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Field label="Товар" htmlFor="productId" error={errors.productId}>
        <NativeSelect id="productId" {...register("productId")}>
          <option value="">— выберите —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Название" htmlFor="title" error={errors.title}>
        <Input id="title" {...register("title")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Тип" htmlFor="kind" error={errors.kind}>
          <NativeSelect id="kind" {...register("kind")}>
            <option value="DATASHEET">Паспорт</option>
            <option value="CERTIFICATE">Сертификат</option>
            <option value="MANUAL">Инструкция</option>
            <option value="DRAWING">Чертёж</option>
          </NativeSelect>
        </Field>
        <Field label="Размер" htmlFor="size" error={errors.size} hint="напр. 1,2 МБ">
          <Input id="size" {...register("size")} />
        </Field>
      </div>
      <Field label="Файл" htmlFor="file" hint="PDF, DOC(X), XLS(X) — заполнит ссылку и размер ниже">
        <div className="flex items-center gap-2">
          <input
            id="file"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelected}
            disabled={uploading}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-secondary/80"
          />
          {uploading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>
      </Field>
      <Field label="Ссылка (URL)" htmlFor="url" error={errors.url} hint="/docs/...pdf">
        <Input id="url" {...register("url")} />
      </Field>
      <Field label="Порядок" htmlFor="order" error={errors.order}>
        <Input id="order" type="number" {...register("order")} />
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
