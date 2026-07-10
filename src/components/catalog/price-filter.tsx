"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PriceFilterProps {
  bounds: { min: number; max: number };
  valueMin: number | null;
  valueMax: number | null;
  onApply: (min: number | null, max: number | null) => void;
}

/** Min/max price inputs with an apply action. Local state until applied. */
export function PriceFilter({ bounds, valueMin, valueMax, onApply }: PriceFilterProps) {
  const [min, setMin] = React.useState(valueMin?.toString() ?? "");
  const [max, setMax] = React.useState(valueMax?.toString() ?? "");

  React.useEffect(() => {
    setMin(valueMin?.toString() ?? "");
    setMax(valueMax?.toString() ?? "");
  }, [valueMin, valueMax]);

  function apply() {
    const parsedMin = min.trim() === "" ? null : Number(min);
    const parsedMax = max.trim() === "" ? null : Number(max);
    onApply(
      Number.isFinite(parsedMin as number) ? parsedMin : null,
      Number.isFinite(parsedMax as number) ? parsedMax : null
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          placeholder={String(bounds.min)}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="h-9"
          aria-label="Цена от"
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="number"
          inputMode="numeric"
          placeholder={String(bounds.max)}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="h-9"
          aria-label="Цена до"
        />
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={apply}>
        Применить, ₸
      </Button>
    </div>
  );
}
