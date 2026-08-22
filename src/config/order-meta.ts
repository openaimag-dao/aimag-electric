/** Display metadata for OrderStatus/OrderDocumentKind: labels + badge styles, shared across UI. */

export const orderStatusMeta: Record<string, { label: string; className: string }> = {
  NEW: { label: "Новый", className: "bg-blue-50 text-blue-700" },
  CONFIRMED: { label: "Подтверждён", className: "bg-indigo-50 text-indigo-700" },
  PROCESSING: { label: "В обработке", className: "bg-amber-50 text-amber-700" },
  SHIPPING: { label: "В пути", className: "bg-purple-50 text-purple-700" },
  DELIVERED: { label: "Доставлен", className: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Отменён", className: "bg-red-50 text-red-700" },
};

export const orderStatusOrder = [
  "NEW",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
] as const;

export const orderDocumentKindMeta: Record<string, string> = {
  INVOICE: "Счёт",
  CONTRACT: "Договор",
  ACT: "Акт",
  SPECIFICATION: "Спецификация",
  WAYBILL: "Накладная",
  OTHER: "Другое",
};

export const orderDocumentKindOrder = [
  "INVOICE",
  "CONTRACT",
  "ACT",
  "SPECIFICATION",
  "WAYBILL",
  "OTHER",
] as const;
