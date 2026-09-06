"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { FacetOption } from "@/types/catalog";

interface FacetCheckboxListProps<T extends string | number> {
  options: FacetOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  /** Collapse the list past N items behind a "показать все" toggle. */
  collapseAfter?: number;
  emptyHint?: string;
}

export function FacetCheckboxList<T extends string | number>({
  options,
  selected,
  onToggle,
  collapseAfter = 6,
  emptyHint = "Нет доступных значений",
}: FacetCheckboxListProps<T>) {
  const [expanded, setExpanded] = React.useState(false);

  if (options.length === 0) {
    return <p className="py-1 text-xs text-muted-foreground">{emptyHint}</p>;
  }

  const visible = expanded ? options : options.slice(0, collapseAfter);
  const hiddenCount = options.length - visible.length;

  return (
    <div className="space-y-0.5">
      {visible.map((opt) => {
        const isChecked = selected.includes(opt.value);
        const id = `facet-${String(opt.value)}`;
        return (
          <label
            key={String(opt.value)}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary/70",
              isChecked && "text-primary"
            )}
          >
            <Checkbox id={id} checked={isChecked} onCheckedChange={() => onToggle(opt.value)} />
            <span className="flex-1 text-steel-700">{opt.label}</span>
            <span className="font-mono text-xs text-muted-foreground">{opt.count}</span>
          </label>
        );
      })}

      {hiddenCount > 0 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="px-2 pt-1 text-xs font-medium text-signal-700 hover:underline"
        >
          Показать ещё {hiddenCount}
        </button>
      )}
      {expanded && options.length > collapseAfter && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-2 pt-1 text-xs font-medium text-signal-700 hover:underline"
        >
          Свернуть
        </button>
      )}
    </div>
  );
}
