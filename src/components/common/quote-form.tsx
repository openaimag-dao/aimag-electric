"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { quoteSchema, type QuoteInput } from "@/lib/validations/quote";
import { submitQuote, uploadQuoteAttachment, type QuoteAttachmentUpload } from "@/server/actions";
import { formatTenge } from "@/lib/money";
import { track } from "@/lib/analytics";
import type { CartItem } from "@/types/cart";

interface QuoteFormProps {
  onSuccess?: () => void;
  /** Cart lines to submit alongside the lead (product page or /cart). */
  items?: CartItem[];
  /** Project/object name, editable when submitting a full cart. */
  defaultTitle?: string;
  /** Pre-fill the free-text message, e.g. a search query that had no catalog match. */
  defaultMessage?: string;
}

export function QuoteForm({ onSuccess, items, defaultTitle, defaultMessage }: QuoteFormProps) {
  const [submitted, setSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [attachments, setAttachments] = React.useState<QuoteAttachmentUpload[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const hasItems = Boolean(items && items.length > 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      title: defaultTitle ?? "",
      company: "",
      name: "",
      phone: "",
      email: "",
      message: defaultMessage ?? "",
      website: "",
    },
  });

  async function handleFiles(files: FileList | File[]) {
    setUploadError(null);
    const fileArray = Array.from(files);
    if (attachments.length + fileArray.length > 5) {
      setUploadError("Можно приложить не больше 5 файлов");
      return;
    }
    setUploading(true);
    for (const file of fileArray) {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadQuoteAttachment(formData);
      if (!result.ok || !result.data) {
        setUploadError(`${file.name}: ${result.error ?? "не удалось загрузить"}`);
        continue;
      }
      setAttachments((prev) => [...prev, result.data!]);
    }
    setUploading(false);
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  }

  async function onSubmit(values: QuoteInput) {
    const result = await submitQuote({ ...values, items, attachments });
    if (!result.ok) {
      setServerError(result.error ?? "Не удалось отправить заявку");
      return;
    }
    setServerError(null);
    track("quote_submit", {
      itemCount: items?.length ?? 0,
      attachmentCount: attachments.length,
    });
    reset();
    setAttachments([]);
    setSubmitted(true);
    onSuccess?.();
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-12 text-signal-600" />
        <p className="font-display text-lg font-semibold text-primary">Заявка отправлена</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Инженер AIMAG ELECTRIC подготовит коммерческое предложение и свяжется с вами в рабочее
          время.
        </p>
        <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
          Отправить ещё одну
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      {hasItems && (
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Позиции проекта ({items!.length})
          </p>
          <ul className="space-y-1.5 text-sm">
            {items!.map((i) => (
              <li key={i.productId} className="flex items-center justify-between gap-3">
                <span className="text-primary">
                  {i.title}{" "}
                  <span className="text-muted-foreground">
                    × {i.qty} {i.unit}
                  </span>
                </span>
                <span className="whitespace-nowrap font-medium text-primary">
                  {i.priceTenge !== null ? formatTenge(i.priceTenge * i.qty) : "по запросу"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasItems && (
        <div className="grid gap-2">
          <Label htmlFor="title">Название проекта (необязательно)</Label>
          <Input id="title" placeholder="Электроснабжение объекта №1" {...register("title")} />
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="company">Компания</Label>
        <Input id="company" placeholder="ТОО / ИП" {...register("company")} />
        {errors.company && <p className="text-xs text-red-600">{errors.company.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Контактное лицо</Label>
          <Input id="name" placeholder="Имя" {...register("name")} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" type="tel" placeholder="+7 ___ ___ __ __" {...register("phone")} />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">E-mail (необязательно)</Label>
        <Input id="email" type="email" placeholder="sales@company.kz" {...register("email")} />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="message">{hasItems ? "Комментарий (необязательно)" : "Что нужно"}</Label>
        <Textarea
          id="message"
          placeholder={
            hasItems
              ? "Особые условия, адрес доставки, сроки…"
              : "Марка кабеля, сечение, метраж, регион доставки или ссылка на спецификацию"
          }
          {...register("message")}
        />
        {errors.message && <p className="text-xs text-red-600">{errors.message.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Файлы (необязательно)</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || attachments.length >= 5}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Paperclip className="size-4" />
          )}
          Прикрепить файл
        </Button>
        <p className="text-xs text-muted-foreground">
          Спецификация, фото шильдика, смета — PDF, Word, Excel или изображение, до 5 файлов.
        </p>
        {attachments.length > 0 && (
          <ul className="space-y-1.5">
            {attachments.map((a) => (
              <li
                key={a.url}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-xs"
              >
                <span className="truncate text-primary">{a.filename}</span>
                <button
                  type="button"
                  aria-label={`Удалить файл ${a.filename}`}
                  onClick={() => removeAttachment(a.url)}
                  className="shrink-0 text-muted-foreground hover:text-red-600"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </div>

      {/* Honeypot — hidden from real users via CSS + off-screen, never via display:none (some bots skip those). A filled value tells submitQuote to silently no-op. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
      )}
      <Button type="submit" variant="signal" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Отправляем…" : "Отправить заявку"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Нажимая кнопку, вы соглашаетесь на обработку данных для подготовки КП.
      </p>
    </form>
  );
}
