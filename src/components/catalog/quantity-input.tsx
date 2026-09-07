"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Stepper + direct numeric entry, so a B2B buyer can type "5000" for a
 * cable order instead of clicking +1 five thousand times.
 */
export function QuantityInput({
  value,
  onChange,
  min = 1,
  step = 1,
  unit,
  size = "default",
  className,
}: {
  value: number;
  onChange: (qty: number) => void;
  min?: number;
  step?: number;
  unit?: string;
  size?: "default" | "sm";
  className?: string;
}) {
  const [text, setText] = React.useState(String(value));

  React.useEffect(() => {
    setText(String(value));
  }, [value]);

  function commit(raw: string) {
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n) || n < min) {
      setText(String(value));
      return;
    }
    onChange(n);
    setText(String(n));
  }

  const btnSize = size === "sm" ? "size-7" : "size-9";
  const inputHeight = size === "sm" ? "h-7" : "h-9";

  return (
    <div
      className={cn("inline-flex items-center gap-1.5 rounded-md border border-border", className)}
    >
      <button
        type="button"
        aria-label="Уменьшить количество"
        className={cn(
          "flex items-center justify-center text-steel-600 hover:text-primary disabled:opacity-40",
          btnSize
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          commit(String(Math.max(min, value - step)));
        }}
        disabled={value <= min}
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          }
        }}
        aria-label={unit ? `Количество, ${unit}` : "Количество"}
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent text-center text-sm tabular-nums outline-none",
          inputHeight
        )}
        style={{ width: `${Math.max(2, text.length + 1)}ch` }}
      />
      <button
        type="button"
        aria-label="Увеличить количество"
        className={cn(
          "flex items-center justify-center text-steel-600 hover:text-primary",
          btnSize
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          commit(String(value + step));
        }}
      >
        <Plus className="size-3.5" />
      </button>
      {unit && <span className="pr-2 text-xs text-muted-foreground">{unit}</span>}
    </div>
  );
}
