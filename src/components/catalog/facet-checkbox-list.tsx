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
  const [search, setSearch] = React.useState("");
  const idPrefix = React.useId();

  if (options.length === 0) {
    return <p className="py-1 text-xs text-muted-foreground">{emptyHint}</p>;
  }

  const selectedValues = new Set(selected);
  const ordered = [
    ...options.filter((option) => selectedValues.has(option.value)),
    ...options.filter((option) => !selectedValues.has(option.value)),
  ];
  const query = search.trim().toLocaleLowerCase();
  const matching = query
    ? ordered.filter((option) => option.label.toLocaleLowerCase().includes(query))
    : ordered;
  const visible =
    query || expanded ? matching : matching.slice(0, Math.max(collapseAfter, selected.length));
  const hiddenCount = matching.length - visible.length;

  return (
    <div className="space-y-0.5">
      {(options.length > 8 || search) && (
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Найти значение"
          aria-label="Найти значение фильтра"
          className="mb-2 h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      {visible.map((opt, index) => {
        const isChecked = selectedValues.has(opt.value);
        // This list appears in both the desktop sidebar and the mobile drawer.
        // An instance-specific id keeps each label connected to its own checkbox.
        const id = `${idPrefix}-${index}`;
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

      {matching.length === 0 && (
        <p className="py-1 text-xs text-muted-foreground">Значение не найдено</p>
      )}
      {!query && hiddenCount > 0 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="px-2 pt-1 text-xs font-medium text-signal-700 hover:underline"
        >
          Показать ещё {hiddenCount}
        </button>
      )}
      {!query && expanded && options.length > collapseAfter && (
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
