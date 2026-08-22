import { z } from "zod";

export const projectStatusValues = [
  "DRAFT",
  "ANALYSIS",
  "QUOTATION",
  "APPROVAL",
  "ORDER",
  "COMPLETED",
  "CANCELLED",
] as const;
export const projectStatus = z.enum(projectStatusValues);

export const projectFormSchema = z.object({
  title: z.string().min(2, "Укажите название проекта").max(160),
  description: z.string().max(2000).optional().or(z.literal("")),
  objectName: z.string().max(160).optional().or(z.literal("")),
  region: z.string().max(120).optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
});
export type ProjectFormInput = z.infer<typeof projectFormSchema>;

export const projectItemInputSchema = z.object({
  productId: z.string().max(60).optional().or(z.literal("")),
  slug: z.string().max(160).optional().or(z.literal("")),
  sku: z.string().max(60).optional().or(z.literal("")),
  title: z.string().min(1, "Укажите наименование").max(300),
  qty: z.coerce.number().positive("Количество должно быть больше нуля").max(1_000_000),
  unit: z.string().min(1).max(20).default("шт"),
  priceTenge: z.number().nonnegative().max(1_000_000_000).nullable().optional(),
  note: z.string().max(500).optional().or(z.literal("")),
});
export type ProjectItemInput = z.infer<typeof projectItemInputSchema>;

/** Save the current client-side cart as a new named, persisted project. */
export const saveCartAsProjectSchema = z.object({
  title: z.string().min(2, "Укажите название проекта").max(160),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(60),
        slug: z.string().max(160).optional().or(z.literal("")),
        sku: z.string().max(60).optional().or(z.literal("")),
        title: z.string().min(1).max(300),
        qty: z.number().positive().max(1_000_000),
        unit: z.string().min(1).max(20),
        priceTenge: z.number().nonnegative().max(1_000_000_000).nullable(),
      })
    )
    .min(1, "В проекте нет товаров"),
});
export type SaveCartAsProjectInput = z.infer<typeof saveCartAsProjectSchema>;
