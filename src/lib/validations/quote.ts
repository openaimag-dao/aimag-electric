import { z } from "zod";

export const quoteSchema = z.object({
  company: z
    .string()
    .min(2, "Укажите название компании")
    .max(120, "Слишком длинное название"),
  name: z
    .string()
    .min(2, "Укажите контактное лицо")
    .max(80, "Слишком длинное имя"),
  phone: z
    .string()
    .min(6, "Укажите телефон")
    .regex(/^[+\d][\d\s()-]{5,}$/, "Некорректный номер телефона"),
  email: z
    .string()
    .email("Некорректный e-mail")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(5, "Опишите позицию или прикрепите спецификацию")
    .max(2000, "Слишком длинное сообщение"),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
