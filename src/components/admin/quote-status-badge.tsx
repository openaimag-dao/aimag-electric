import { cn } from "@/lib/utils";

export const quoteStatusMeta: Record<string, { label: string; className: string }> = {
  NEW: { label: "Новая", className: "bg-blue-50 text-blue-700" },
  IN_PROGRESS: { label: "В работе", className: "bg-amber-50 text-amber-700" },
  SENT: { label: "КП отправлено", className: "bg-purple-50 text-purple-700" },
  WON: { label: "Заказ оформлен", className: "bg-emerald-50 text-emerald-700" },
  LOST: { label: "Отклонена", className: "bg-secondary text-muted-foreground" },
  SUPPLIER_REQUEST: { label: "Запрос поставщику", className: "bg-sky-50 text-sky-700" },
  PROPOSAL_PREP: { label: "Подготовка КП", className: "bg-amber-50 text-amber-700" },
  NEGOTIATION: { label: "Согласование", className: "bg-indigo-50 text-indigo-700" },
  CLOSED: { label: "Закрыта", className: "bg-secondary text-muted-foreground" },
};

export function QuoteStatusBadge({ status }: { status: string }) {
  const meta = quoteStatusMeta[status] ?? {
    label: status,
    className: "bg-secondary text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}
