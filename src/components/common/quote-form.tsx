"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { quoteSchema, type QuoteInput } from "@/lib/validations/quote";
import { submitQuote } from "@/server/actions";
import { formatTenge } from "@/lib/money";
import { track } from "@/lib/analytics";
import { siteConfig } from "@/config/site";
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
  const formId = React.useId();
  const [submitted, setSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
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
    },
  });

  async function onSubmit(values: QuoteInput) {
    setServerError(null);
    try {
      const result = await submitQuote({ ...values, items });
      if (!result.ok) {
        setServerError(result.error ?? "Не удалось отправить заявку");
        return;
      }
    } catch {
      setServerError(
        "Не удалось подтвердить отправку. Данные сохранены в форме. Проверьте соединение или уточните получение заявки по телефону."
      );
      return;
    }
    setServerError(null);
    reset();
    setSubmitted(true);
    track("quote_submit", { page_path: window.location.pathname });
    onSuccess?.();
  }

  if (submitted) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-8 text-center">
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
            Позиции заявки ({items!.length})
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
          <Label htmlFor={`${formId}-title`}>Название проекта (необязательно)</Label>
          <Input
            id={`${formId}-title`}
            placeholder="Электроснабжение объекта №1"
            {...register("title")}
          />
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`${formId}-company`}>Компания</Label>
        <Input
          id={`${formId}-company`}
          autoComplete="organization"
          placeholder="ТОО / ИП"
          aria-invalid={Boolean(errors.company)}
          aria-describedby={errors.company ? `${formId}-company-error` : undefined}
          {...register("company")}
        />
        {errors.company && (
          <p id={`${formId}-company-error`} className="text-xs text-red-600">
            {errors.company.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${formId}-name`}>Контактное лицо</Label>
          <Input
            id={`${formId}-name`}
            autoComplete="name"
            placeholder="Имя"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${formId}-name-error` : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id={`${formId}-name-error`} className="text-xs text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${formId}-phone`}>Телефон</Label>
          <Input
            id={`${formId}-phone`}
            autoComplete="tel"
            inputMode="tel"
            type="tel"
            placeholder="+7 ___ ___ __ __"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${formId}-phone-error` : undefined}
            {...register("phone")}
          />
          {errors.phone && (
            <p id={`${formId}-phone-error`} className="text-xs text-red-600">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${formId}-email`}>E-mail (необязательно)</Label>
        <Input
          id={`${formId}-email`}
          autoComplete="email"
          type="email"
          placeholder="sales@company.kz"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${formId}-email-error` : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id={`${formId}-email-error`} className="text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${formId}-message`}>
          {hasItems ? "Комментарий (необязательно)" : "Что нужно"}
        </Label>
        <Textarea
          id={`${formId}-message`}
          placeholder={
            hasItems
              ? "Особые условия, адрес доставки, сроки…"
              : "Марка кабеля, сечение, метраж, регион доставки или ссылка на спецификацию"
          }
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${formId}-message-error` : undefined}
          {...register("message")}
        />
        {errors.message && (
          <p id={`${formId}-message-error`} className="text-xs text-red-600">
            {errors.message.message}
          </p>
        )}
      </div>

      {serverError && (
        <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{serverError}</p>
          <a
            className="mt-2 inline-block font-medium underline"
            href={`tel:${siteConfig.contacts.phone.replace(/[\s()-]/g, "")}`}
          >
            Позвонить: {siteConfig.contacts.phone}
          </a>
        </div>
      )}
      <Button type="submit" variant="signal" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Отправляем…" : "Отправить заявку"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Нажимая кнопку, вы соглашаетесь на обработку данных для подготовки КП.{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Политика конфиденциальности
        </Link>
      </p>
    </form>
  );
}
