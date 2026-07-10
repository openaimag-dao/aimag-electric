import { Check, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Availability } from "@/types/catalog";

const config: Record<
  Availability,
  { label: string; className: string; icon: typeof Check }
> = {
  in_stock: {
    label: "В наличии",
    className: "bg-emerald-50 text-emerald-700",
    icon: Check,
  },
  on_order: {
    label: "Под заказ",
    className: "bg-amber-50 text-amber-700",
    icon: Clock,
  },
  out: {
    label: "Нет в наличии",
    className: "bg-secondary text-muted-foreground",
    icon: X,
  },
};

export function AvailabilityBadge({
  status,
  className,
}: {
  status: Availability;
  className?: string;
}) {
  const { label, className: tone, icon: Icon } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}
