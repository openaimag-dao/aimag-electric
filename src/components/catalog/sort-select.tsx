"use client";

import { ArrowUpDown } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortOptions } from "@/config/catalog-sort";
import { useCatalogFilters } from "@/hooks/use-catalog-filters";
import { track } from "@/lib/analytics";
import type { SortKey } from "@/types/catalog";

export function SortSelect() {
  const { filters, update } = useCatalogFilters();

  return (
    <Select
      value={filters.sort}
      onValueChange={(value) => {
        track("sort_change", { sort: value });
        update((prev) => ({ ...prev, sort: value as SortKey }), { keepPage: true });
      }}
    >
      <SelectTrigger className="w-full min-w-[210px] sm:w-auto">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <ArrowUpDown className="size-4" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {sortOptions.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
