import { z } from "zod";

const slug = z
  .string()
  .min(1, "Укажите slug")
  .regex(/^[a-z0-9-]+$/, "Только строчные латинские буквы, цифры и дефис");

export const categoryFormSchema = z.object({
  slug,
  title: z.string().min(2, "Укажите название"),
  description: z.string().optional().or(z.literal("")),
  spec: z.string().optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const brandFormSchema = z.object({
  slug,
  name: z.string().min(2, "Укажите название"),
  origin: z.string().optional().or(z.literal("")),
});
export type BrandFormInput = z.infer<typeof brandFormSchema>;

export const warehouseFormSchema = z.object({
  code: z.string().min(1, "Укажите код").max(10, "Слишком длинный код"),
  name: z.string().min(2, "Укажите название"),
  city: z.string().min(2, "Укажите город"),
});
export type WarehouseFormInput = z.infer<typeof warehouseFormSchema>;

const productBadge = z.enum(["HIT", "NEW", "IN_STOCK"]);

export const productFormSchema = z.object({
  slug,
  sku: z.string().min(1, "Укажите артикул"),
  title: z.string().min(2, "Укажите название"),
  description: z.string().optional().or(z.literal("")),
  unit: z.string().min(1).default("шт"),
  packaging: z.string().optional().or(z.literal("")),
  warranty: z.string().optional().or(z.literal("")),
  leadTime: z.string().optional().or(z.literal("")),
  badge: z.union([productBadge, z.literal("")]).optional(),
  popularity: z.coerce.number().int().min(0).default(0),
  published: z.coerce.boolean().default(true),
  categoryId: z.string().min(1, "Выберите категорию"),
  brandId: z.string().min(1, "Выберите производителя"),
});
export type ProductFormInput = z.infer<typeof productFormSchema>;

const priceKind = z.enum(["BASE", "WHOLESALE", "PROMO"]);

export const priceFormSchema = z.object({
  productId: z.string().min(1, "Выберите товар"),
  kind: priceKind.default("BASE"),
  /** Цена в тенге в форме; сервис конвертирует в тиыны. Пусто = по запросу. */
  amountTenge: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  minQty: z.coerce.number().min(1).default(1),
});
export type PriceFormInput = z.infer<typeof priceFormSchema>;

const documentKind = z.enum(["CERTIFICATE", "DATASHEET", "MANUAL", "DRAWING"]);

export const documentFormSchema = z.object({
  productId: z.string().min(1, "Выберите товар"),
  title: z.string().min(2, "Укажите название"),
  kind: documentKind.default("DATASHEET"),
  url: z.string().min(1, "Укажите ссылку на файл"),
  size: z.string().optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});
export type DocumentFormInput = z.infer<typeof documentFormSchema>;

const userRole = z.enum(["ADMIN", "MANAGER", "CUSTOMER"]);

export const userFormSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  email: z.string().email("Некорректный e-mail"),
  role: userRole.default("CUSTOMER"),
  company: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  // Optional: leave blank to keep the account passwordless (no login) on create,
  // or to keep the existing password unchanged on edit.
  password: z.string().min(8, "Минимум 8 символов").max(72).optional().or(z.literal("")),
});
export type UserFormInput = z.infer<typeof userFormSchema>;

export const quoteStatus = z.enum(["NEW", "IN_PROGRESS", "SENT", "WON", "LOST"]);
export type QuoteStatusValue = z.infer<typeof quoteStatus>;
