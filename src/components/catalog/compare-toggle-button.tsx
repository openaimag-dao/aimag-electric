"use client";

import { Scale } from "lucide-react";
import { toast } from "sonner";

import { useCompare } from "@/components/compare/compare-provider";
import { cn } from "@/lib/utils";

export function CompareToggleButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { has, toggle, max } = useCompare();
  const active = has(productId);

  return (
    <button
      type="button"
      aria-label={active ? "Убрать из сравнения" : "Добавить к сравнению"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const result = toggle(productId);
        if (result === "full") {
          toast.error(`Можно сравнить не более ${max} товаров одновременно`);
        }
      }}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-background/90 text-steel-500 shadow-sm backdrop-blur transition-colors hover:text-signal-700",
        active && "text-signal-700",
        className
      )}
    >
      <Scale className="size-4" />
    </button>
  );
}
