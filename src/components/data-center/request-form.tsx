"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Paperclip, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  dataCenterQuoteSchema,
  type DataCenterQuoteInput,
} from "@/lib/validations/data-center-quote";
import { submitDataCenterQuote, uploadDataCenterSpec } from "@/server/actions";
import { track } from "@/lib/analytics";
import { TurnstileWidget } from "@/components/common/turnstile-widget";
import { dataCenterCategories } from "@/config/data-center";

interface UploadedFile {
  title: string;
  url: string;
  size: string;
}

interface DataCenterRequestFormProps {
  /** Pre-ticks this category when the form is opened from a specific category page. */
  defaultCategory?: string;
  /** Pre-fills the comment, e.g. when opened from the "Запросить оптовые цены" CTA. */
  defaultComment?: string;
  onSuccess?: () => void;
}

export function DataCenterRequestForm({
  defaultCategory,
  defaultComment,
  onSuccess,
}: DataCenterRequestFormProps) {
  const formId = React.useId();
  const fieldId = (name: string) => `${formId}-${name}`;
  const [submitted, setSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    defaultCategory ? [defaultCategory] : []
  );
  const [categoriesError, setCategoriesError] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DataCenterQuoteInput>({
    resolver: (values, context, options) =>
      zodResolver(dataCenterQuoteSchema)(
        { ...values, categories: selectedCategories, documents: files },
        context,
        options
      ),
    defaultValues: {
      company: "",
      bin: "",
      name: "",
      phone: "",
      email: "",
      region: "",
      categories: selectedCategories,
      items: [],
      comment: defaultComment ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  function toggleCategory(title: string) {
    setCategoriesError(null);
    setSelectedCategories((prev) =>
      prev.includes(title) ? prev.filter((c) => c !== title) : [...prev, title]
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadDataCenterSpec(formData);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!result.ok || !result.data) {
      setUploadError(result.error ?? "Не удалось загрузить файл");
      return;
    }
    setFiles((prev) => [...prev, result.data!]);
  }

  function removeFile(url: string) {
    setFiles((prev) => prev.filter((f) => f.url !== url));
  }

  async function onSubmit(values: DataCenterQuoteInput) {
    setServerError(null);
    if (selectedCategories.length === 0) {
      setCategoriesError("Выберите хотя бы одну категорию оборудования");
      return;
    }
    let result: Awaited<ReturnType<typeof submitDataCenterQuote>>;
    try {
      result = await submitDataCenterQuote({
        ...values,
        categories: selectedCategories,
        documents: files,
        sourcePath: window.location.pathname,
        turnstileToken: turnstileToken ?? undefined,
      });
    } catch {
      setServerError(
        "Не удалось получить подтверждение отправки. Проверьте связь или уточните у менеджера, получена ли заявка, прежде чем отправлять её повторно."
      );
      return;
    }
    if (!result.ok) {
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) setError(field as keyof DataCenterQuoteInput, { type: "server", message });
      }
      setServerError(result.error ?? "Не удалось отправить заявку");
      return;
    }
    reset();
    setFiles([]);
    setSelectedCategories([]);
    setSubmitted(true);
    track("data_center_quote_submit");
    onSuccess?.();
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-12 text-signal-600" />
        <p className="font-display text-lg font-semibold text-primary">Заявка отправлена</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Инженер AIMAG ELECTRIC рассмотрит заявку по оборудованию для дата-центра и свяжется с вами
          в рабочее время.
        </p>
        <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
          Отправить ещё одну
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label>Категории оборудования</Label>
        <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
          {dataCenterCategories.map((cat) => (
            <label key={cat.slug} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedCategories.includes(cat.title)}
                onCheckedChange={() => toggleCategory(cat.title)}
              />
              {cat.title}
            </label>
          ))}
        </div>
        {categoriesError && <p className="text-xs text-red-600">{categoriesError}</p>}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Перечень необходимого оборудования (необязательно)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ title: "", qty: 1, unit: "шт" })}
            disabled={fields.length >= 50}
          >
            <Plus className="size-3.5" /> Добавить позицию
          </Button>
        </div>
        {fields.length > 0 && (
          <div className="grid gap-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="Наименование"
                  className="flex-1"
                  {...register(`items.${index}.title`)}
                />
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Кол-во"
                  className="w-24"
                  {...register(`items.${index}.qty`, { valueAsNumber: true })}
                />
                <Input placeholder="Ед." className="w-20" {...register(`items.${index}.unit`)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить позицию"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("company")}>Название компании</Label>
        <Input
          id={fieldId("company")}
          placeholder="ТОО / ИП"
          autoComplete="organization"
          aria-invalid={Boolean(errors.company)}
          {...register("company")}
        />
        {errors.company && <p className="text-xs text-red-600">{errors.company.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={fieldId("bin")}>БИН (необязательно)</Label>
          <Input
            id={fieldId("bin")}
            placeholder="123456789012"
            inputMode="numeric"
            aria-invalid={Boolean(errors.bin)}
            {...register("bin")}
          />
          {errors.bin && <p className="text-xs text-red-600">{errors.bin.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId("region")}>Регион поставки</Label>
          <Input
            id={fieldId("region")}
            placeholder="Шымкент, Алматы, Астана…"
            list={fieldId("region-list")}
            {...register("region")}
          />
          <datalist id={fieldId("region-list")}>
            <option value="Шымкент" />
            <option value="Алматы" />
            <option value="Астана" />
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={fieldId("name")}>Контактное лицо</Label>
          <Input
            id={fieldId("name")}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId("phone")}>Телефон</Label>
          <Input
            id={fieldId("phone")}
            type="tel"
            autoComplete="tel"
            placeholder="+7 ___ ___ __ __"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("email")}>E-mail (необязательно)</Label>
        <Input
          id={fieldId("email")}
          type="email"
          autoComplete="email"
          placeholder="procurement@company.kz"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("comment")}>Комментарий</Label>
        <Textarea
          id={fieldId("comment")}
          placeholder="Параметры объекта, сроки, требования к документам…"
          aria-invalid={Boolean(errors.comment)}
          {...register("comment")}
        />
        {errors.comment && <p className="text-xs text-red-600">{errors.comment.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Спецификация (PDF, XLSX, DOCX)</Label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            disabled={uploading || files.length >= 10}
            className="text-sm"
          />
          {uploading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        {files.length > 0 && (
          <ul className="grid gap-1">
            {files.map((f) => (
              <li
                key={f.url}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-xs"
              >
                <span className="flex items-center gap-1.5 truncate text-primary">
                  <Paperclip className="size-3.5 shrink-0" />
                  {f.title} <span className="text-muted-foreground">({f.size})</span>
                </span>
                <button
                  type="button"
                  aria-label="Удалить файл"
                  onClick={() => removeFile(f.url)}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TurnstileWidget onToken={setTurnstileToken} />

      {serverError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}
      <Button
        type="submit"
        variant="signal"
        size="lg"
        disabled={isSubmitting || uploading || (turnstileRequired && !turnstileToken)}
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Отправляем…" : "Отправить заявку"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Нажимая кнопку, вы соглашаетесь на обработку данных для подготовки КП. Подробнее — в{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          политике конфиденциальности
        </Link>
        .
      </p>
    </form>
  );
}
