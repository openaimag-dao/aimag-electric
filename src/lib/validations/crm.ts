import { z } from "zod";

export const customerStatus = z.enum(["LEAD", "ACTIVE", "INACTIVE"]);

export const customerFormSchema = z.object({
  company: z.string().min(2, "Укажите компанию"),
  contact: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.union([z.string().email("Некорректный e-mail"), z.literal("")]).optional(),
  city: z.string().optional().or(z.literal("")),
  bin: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: customerStatus.default("LEAD"),
  ownerId: z.string().optional().or(z.literal("")),
});
export type CustomerFormInput = z.infer<typeof customerFormSchema>;

export const dealStage = z.enum([
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

export const dealFormSchema = z.object({
  title: z.string().min(2, "Укажите название сделки"),
  customerId: z.string().min(1, "Выберите клиента"),
  stage: dealStage.default("NEW"),
  amountTenge: z.union([z.literal(""), z.coerce.number().min(0)]).optional(),
  probability: z.coerce.number().int().min(0).max(100).default(0),
  expectedAt: z.string().optional().or(z.literal("")),
  ownerId: z.string().optional().or(z.literal("")),
  lostReason: z.string().optional().or(z.literal("")),
});
export type DealFormInput = z.infer<typeof dealFormSchema>;

export const activityType = z.enum(["NOTE", "CALL", "EMAIL", "MEETING", "TASK"]);

export const activityFormSchema = z.object({
  type: activityType.default("NOTE"),
  subject: z.string().min(2, "Укажите тему"),
  body: z.string().optional().or(z.literal("")),
  dueAt: z.string().optional().or(z.literal("")),
  customerId: z.string().optional().or(z.literal("")),
  dealId: z.string().optional().or(z.literal("")),
});
export type ActivityFormInput = z.infer<typeof activityFormSchema>;
