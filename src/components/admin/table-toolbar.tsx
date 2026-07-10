"use client";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TableToolbar({
  query,
  onQueryChange,
  onAdd,
  addLabel = "Добавить",
  placeholder = "Поиск…",
  count,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  placeholder?: string;
  count?: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm shadow-sm focus-visible:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex items-center gap-3">
        {count !== undefined && (
          <span className="text-sm text-muted-foreground">Всего: {count}</span>
        )}
        {onAdd && (
          <Button onClick={onAdd} variant="signal">
            <Plus />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
