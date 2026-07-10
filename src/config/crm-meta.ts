/** Display metadata for CRM enums: labels + badge styles, shared across UI. */

export const dealStageMeta: Record<string, { label: string; className: string }> = {
  NEW: { label: "Новая", className: "bg-blue-50 text-blue-700" },
  QUALIFIED: { label: "Квалифицирована", className: "bg-indigo-50 text-indigo-700" },
  PROPOSAL: { label: "КП отправлено", className: "bg-purple-50 text-purple-700" },
  NEGOTIATION: { label: "Переговоры", className: "bg-amber-50 text-amber-700" },
  WON: { label: "Выиграна", className: "bg-emerald-50 text-emerald-700" },
  LOST: { label: "Проиграна", className: "bg-secondary text-muted-foreground" },
};

export const dealStageOrder = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const customerStatusMeta: Record<string, { label: string; className: string }> = {
  LEAD: { label: "Лид", className: "bg-amber-50 text-amber-700" },
  ACTIVE: { label: "Активный", className: "bg-emerald-50 text-emerald-700" },
  INACTIVE: { label: "Неактивный", className: "bg-secondary text-muted-foreground" },
};

export const activityTypeMeta: Record<string, { label: string; icon: string }> = {
  NOTE: { label: "Заметка", icon: "StickyNote" },
  CALL: { label: "Звонок", icon: "Phone" },
  EMAIL: { label: "E-mail", icon: "Mail" },
  MEETING: { label: "Встреча", icon: "Users" },
  TASK: { label: "Задача", icon: "CheckSquare" },
};
