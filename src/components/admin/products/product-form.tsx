"use client";

import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TriangleAlert } from "lucide-react";
import { handleFormResult } from "@/lib/admin/form-submit";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, Input, Textarea, NativeSelect } from "@/components/admin/form-fields";
import { Label } from "@/components/ui/label";
import { productFormSchema, type ProductFormInput } from "@/lib/validations/admin";
import {
  createProduct,
  updateProduct,
  findPossibleDuplicates,
  type DuplicateCandidate,
} from "@/server/actions/admin";
import { ProductPhotosPanel } from "@/components/admin/products/product-photos-panel";
import { ProductSpecsPanel } from "@/components/admin/products/product-specs-panel";

export interface ProductRow {
  id: string;
  slug: string;
  sku: string;
  title: string;
  description: string | null;
  unit: string;
  packaging: string | null;
  warranty: string | null;
  leadTime: string | null;
  badge: string | null;
  popularity: number;
  published: boolean;
  isFeatured: boolean;
  categoryId: string;
  brandId: string;
}

interface Ref {
  id: string;
  label: string;
}

export function ProductForm({
  initial,
  categories,
  brands,
  onDone,
}: {
  initial?: ProductRow;
  categories: Ref[];
  brands: Ref[];
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      slug: initial?.slug ?? "",
      sku: initial?.sku ?? "",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      unit: initial?.unit ?? "шт",
      packaging: initial?.packaging ?? "",
      warranty: initial?.warranty ?? "",
      leadTime: initial?.leadTime ?? "",
      badge: (initial?.badge as ProductFormInput["badge"]) ?? "",
      popularity: initial?.popularity ?? 0,
      published: initial?.published ?? true,
      isFeatured: initial?.isFeatured ?? false,
      categoryId: initial?.categoryId ?? "",
      brandId: initial?.brandId ?? "",
    },
  });

  async function onSubmit(values: ProductFormInput) {
    const result = isEdit ? await updateProduct(initial!.id, values) : await createProduct(values);
    handleFormResult<ProductFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Товар обновлён" : "Товар создан",
    });
  }

  const title = useWatch({ control, name: "title" });
  const brandId = useWatch({ control, name: "brandId" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const [duplicates, setDuplicates] = React.useState<DuplicateCandidate[]>([]);

  React.useEffect(() => {
    if (!title?.trim() || !brandId) {
      setDuplicates([]);
      return;
    }
    const t = setTimeout(async () => {
      const result = await findPossibleDuplicates({
        title,
        brandId,
        excludeId: initial?.id,
      });
      setDuplicates(result.ok ? (result.data ?? []) : []);
    }, 500);
    return () => clearTimeout(t);
  }, [title, brandId, initial?.id]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {duplicates.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Возможно, такой товар уже есть у этого производителя:</p>
            <ul className="mt-1 list-inside list-disc">
              {duplicates.map((d) => (
                <li key={d.id}>
                  {d.title} <span className="font-mono text-xs">({d.sku})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isEdit ? (
        <ProductPhotosPanel productId={initial!.id} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          Фото можно будет добавить после создания товара — откройте его на редактирование.
        </p>
      )}

      <Field label="Название" htmlFor="title" error={errors.title}>
        <Input id="title" {...register("title")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Артикул (SKU)" htmlFor="sku" error={errors.sku}>
          <Input id="sku" {...register("sku")} />
        </Field>
        <Field label="Slug" htmlFor="slug" error={errors.slug} hint="латиница, для URL">
          <Input id="slug" {...register("slug")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Категория" htmlFor="categoryId" error={errors.categoryId}>
          <NativeSelect id="categoryId" {...register("categoryId")}>
            <option value="">— выберите —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Производитель" htmlFor="brandId" error={errors.brandId}>
          <NativeSelect id="brandId" {...register("brandId")}>
            <option value="">— выберите —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {isEdit && categoryId && (
        <ProductSpecsPanel productId={initial!.id} categoryId={categoryId} />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Единица" htmlFor="unit" error={errors.unit} hint="м / шт / компл">
          <Input id="unit" {...register("unit")} />
        </Field>
        <Field label="Бейдж" htmlFor="badge" error={errors.badge}>
          <NativeSelect id="badge" {...register("badge")}>
            <option value="">— нет —</option>
            <option value="HIT">Хит</option>
            <option value="NEW">Новинка</option>
            <option value="IN_STOCK">Со склада</option>
          </NativeSelect>
        </Field>
        <Field label="Популярность" htmlFor="popularity" error={errors.popularity}>
          <Input id="popularity" type="number" {...register("popularity")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Срок поставки" htmlFor="leadTime" error={errors.leadTime}>
          <Input id="leadTime" {...register("leadTime")} />
        </Field>
        <Field label="Гарантия" htmlFor="warranty" error={errors.warranty}>
          <Input id="warranty" {...register("warranty")} />
        </Field>
      </div>

      <Field label="Упаковка / кратность" htmlFor="packaging" error={errors.packaging}>
        <Input id="packaging" {...register("packaging")} />
      </Field>

      <Field label="Описание" htmlFor="description" error={errors.description}>
        <Textarea id="description" rows={4} {...register("description")} />
      </Field>

      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
        <div>
          <Label htmlFor="published">Опубликован</Label>
          <p className="text-xs text-muted-foreground">
            Скрытые товары не показываются в каталоге.
          </p>
        </div>
        <Controller
          control={control}
          name="published"
          render={({ field }) => (
            <Switch id="published" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
        <div>
          <Label htmlFor="isFeatured">В витрине на главной</Label>
          <p className="text-xs text-muted-foreground">
            Показывать в подборке популярных товаров на главной странице.
          </p>
        </div>
        <Controller
          control={control}
          name="isFeatured"
          render={({ field }) => (
            <Switch id="isFeatured" checked={field.value} onCheckedChange={field.onChange} />
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
