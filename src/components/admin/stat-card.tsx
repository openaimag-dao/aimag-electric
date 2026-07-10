import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  accent?: boolean;
}) {
  const body = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all",
        href && "hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-md"
      )}
    >
      <span
        className={cn(
          "inline-flex size-12 shrink-0 items-center justify-center rounded-xl",
          accent ? "bg-signal text-steel-950" : "bg-steel-950 text-signal"
        )}
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0">
        <div className="font-display text-2xl font-bold text-primary">{value}</div>
        <div className="truncate text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
