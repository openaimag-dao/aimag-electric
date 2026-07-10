import { cn } from "@/lib/utils";
import { formatTenge } from "@/lib/money";

/** Renders a price as "1 240 ₸/м" or a "по запросу" note when price is null. */
export function ProductPrice({
  price,
  unit,
  className,
}: {
  price: number | null;
  unit: string;
  className?: string;
}) {
  if (price === null) {
    return (
      <span className={cn("font-display text-base font-semibold text-steel-600", className)}>
        Цена по запросу
      </span>
    );
  }
  return (
    <span className={cn("font-display font-bold text-primary", className)}>
      {formatTenge(price)}
      {unit && <span className="text-sm font-medium text-muted-foreground">/{unit}</span>}
    </span>
  );
}
