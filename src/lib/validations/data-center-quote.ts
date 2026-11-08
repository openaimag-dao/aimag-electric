import { z } from "zod";

/** One free-text equipment line on the data-center B2B RFQ form — unlike quoteItemSchema, this never carries a real productId (most of this catalog isn't in stock, only sourced to order). */
export const dataCenterItemSchema = z.object({
  title: z.string().min(1, "Укажите наименование").max(300),
  qty: z.number().positive("Укажите количество").max(1_000_000),
  unit: z.string().min(1).max(20),
});

export const dataCenterQuoteSchema = z.object({
  company: z.string().min(2, "Укажите название компании").max(120, "Слишком длинное название"),
  bin: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "БИН/ИИН — 12 цифр")
    .optional()
    .or(z.literal("")),
  name: z.string().min(2, "Укажите контактное лицо").max(80, "Слишком длинное имя"),
  phone: z
    .string()
    .min(6, "Укажите телефон")
    .regex(/^[+\d][\d\s()-]{5,}$/, "Некорректный номер телефона"),
  email: z.string().email("Некорректный e-mail").optional().or(z.literal("")),
  region: z.string().max(120).optional().or(z.literal("")),
  categories: z.array(z.string().min(1).max(120)).min(1, "Выберите хотя бы одну категорию"),
  items: z.array(dataCenterItemSchema).max(50).optional(),
  comment: z.string().max(2000, "Слишком длинное сообщение").optional().or(z.literal("")),
  documents: z
    .array(
      z.object({ title: z.string().max(260), url: z.string().url(), size: z.string().max(20) })
    )
    .max(10)
    .optional(),
  sourcePath: z
    .string()
    .max(300)
    .regex(/^\/(?!\/)[^?#]*$/)
    .optional(),
  /** Cloudflare Turnstile token — present only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. */
  turnstileToken: z.string().optional(),
});

export type DataCenterQuoteInput = z.infer<typeof dataCenterQuoteSchema>;
export type DataCenterItemInput = z.infer<typeof dataCenterItemSchema>;
