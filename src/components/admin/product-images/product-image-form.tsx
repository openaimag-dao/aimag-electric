"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ImageOff } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/admin/form-fields";
import { productImageFormSchema, type ProductImageFormInput } from "@/lib/validations/admin";
import { createProductImage, updateProductImage } from "@/server/actions/admin";

export interface ProductImageRow {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  order: number;
}

interface Ref {
  id: string;
  label: string;
}

export function ProductImageForm({
  initial,
  products,
  onDone,
}: {
  initial?: ProductImageRow;
  products: Ref[];
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductImageFormInput>({
    resolver: zodResolver(productImageFormSchema),
    defaultValues: {
      productId: initial?.productId ?? "",
      url: initial?.url ?? "",
      alt: initial?.alt ?? "",
      order: initial?.order ?? 0,
    },
  });

  const previewUrl = watch("url");

  async function onSubmit(values: ProductImageFormInput) {
    const result = isEdit
      ? await updateProductImage(initial!.id, values)
      : await createProductImage(values);
    handleFormResult<ProductImageFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Фото обновлено" : "Фото добавлено",
    });
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
      <Field label="Ссылка на фото (URL)" htmlFor="url" error={errors.url} hint="https://...">
        <Input id="url" {...register("url")} />
      </Field>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, live preview only
        <img
          src={previewUrl}
          alt=""
          className="h-32 w-32 rounded-lg border border-border object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
          <ImageOff className="size-6" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Alt-текст" htmlFor="alt" error={errors.alt} hint="для SEO/доступности">
          <Input id="alt" {...register("alt")} />
        </Field>
        <Field label="Порядок" htmlFor="order" error={errors.order} hint="0 — главное фото">
          <Input id="order" type="number" {...register("order")} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" variant="signal" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </form>
  );
}
