import { z } from "zod";

/** One cart line submitted with the КП request — see src/types/cart.ts. */
export const quoteItemSchema = z.object({
  productId: z.string().min(1).max(60),
  sku: z.string().max(60).optional().or(z.literal("")),
  title: z.string().min(1).max(300),
  qty: z.number().positive().max(1_000_000),
  unit: z.string().min(1).max(20),
  priceTenge: z.number().nonnegative().max(1_000_000_000).nullable(),
});

export const quoteSchema = z
  .object({
    title: z.string().max(160).optional().or(z.literal("")),
    company: z.string().min(2, "Укажите название компании").max(120, "Слишком длинное название"),
    name: z.string().min(2, "Укажите контактное лицо").max(80, "Слишком длинное имя"),
    phone: z
      .string()
      .min(6, "Укажите телефон")
      .regex(/^[+\d][\d\s()-]{5,}$/, "Некорректный номер телефона"),
    email: z.string().email("Некорректный e-mail").optional().or(z.literal("")),
    message: z.string().max(2000, "Слишком длинное сообщение").optional().or(z.literal("")),
    items: z.array(quoteItemSchema).max(200).optional(),
  })
  .refine((v) => (v.items && v.items.length > 0) || (v.message && v.message.trim().length >= 5), {
    message: "Опишите позицию или добавьте товары в проект",
    path: ["message"],
  });

export type QuoteInput = z.infer<typeof quoteSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
