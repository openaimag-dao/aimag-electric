import { z } from "zod";

import { companyRole } from "@/lib/validations/admin";

export const teamInviteFormSchema = z.object({
  companyId: z.string().min(1),
  email: z.string().email("Некорректный email"),
  role: companyRole,
});
export type TeamInviteFormInput = z.infer<typeof teamInviteFormSchema>;

export const teamRoleFormSchema = z.object({
  companyId: z.string().min(1),
  memberId: z.string().min(1),
  role: companyRole,
});
export type TeamRoleFormInput = z.infer<typeof teamRoleFormSchema>;
