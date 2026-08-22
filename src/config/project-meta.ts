/** Display metadata for ProjectStatus: labels + badge styles, shared across UI. */

export const projectStatusMeta: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Черновик", className: "bg-secondary text-muted-foreground" },
  ANALYSIS: { label: "Анализ", className: "bg-blue-50 text-blue-700" },
  QUOTATION: { label: "Формирование КП", className: "bg-indigo-50 text-indigo-700" },
  APPROVAL: { label: "Согласование", className: "bg-amber-50 text-amber-700" },
  ORDER: { label: "Заказ", className: "bg-purple-50 text-purple-700" },
  COMPLETED: { label: "Завершён", className: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Отменён", className: "bg-red-50 text-red-700" },
};

export const projectStatusOrder = [
  "DRAFT",
  "ANALYSIS",
  "QUOTATION",
  "APPROVAL",
  "ORDER",
  "COMPLETED",
  "CANCELLED",
] as const;
