import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Укажите имя").max(80, "Слишком длинное имя"),
    company: z.string().max(120, "Слишком длинное название").optional().or(z.literal("")),
    phone: z
      .string()
      .max(30)
      .regex(/^[+\d][\d\s()-]{5,}$/, "Некорректный номер телефона")
      .optional()
      .or(z.literal("")),
    email: z.string().email("Некорректный e-mail").max(160),
    password: z.string().min(8, "Минимум 8 символов").max(72),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
