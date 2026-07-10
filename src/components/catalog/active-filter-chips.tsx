"use client";

import { X } from "lucide-react";

import { useCatalogFilters } from "@/hooks/use-catalog-filters";
import type { CatalogFacets } from "@/lib/catalog";

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Removable chips summarizing every active filter — DigiKey-style. */
export function ActiveFilterChips({ facets }: { facets: CatalogFacets }) {
  const { filters, update, toggle, toggleNum } = useCatalogFilters();

  const labelFor = <T extends string | number>(
    options: { value: T; label: string }[],
    value: T
  ) => options.find((o) => o.value === value)?.label ?? String(value);

  const chips: Chip[] = [];

  if (filters.q) {
    chips.push({
      key: `q`,
      label: `Поиск: «${filters.q}»`,
      onRemove: () => update((prev) => ({ ...prev, q: "" })),
    });
  }
  filters.categories.forEach((v) =>
    chips.push({
      key: `cat-${v}`,
      label: labelFor(facets.categories, v),
      onRemove: () => toggle("categories", v),
    })
  );
  filters.manufacturers.forEach((v) =>
    chips.push({
      key: `brand-${v}`,
      label: v,
      onRemove: () => toggle("manufacturers", v),
    })
  );
  filters.materials.forEach((v) =>
    chips.push({
      key: `mat-${v}`,
      label: v,
      onRemove: () => toggle("materials", v),
    })
  );
  filters.cores.forEach((v) =>
    chips.push({
      key: `cores-${v}`,
      label: `${v} жил.`,
      onRemove: () => toggleNum("cores", v),
    })
  );
  filters.crossSections.forEach((v) =>
    chips.push({
      key: `cs-${v}`,
      label: `${v} мм²`,
      onRemove: () => toggleNum("crossSections", v),
    })
  );
  filters.voltages.forEach((v) =>
    chips.push({
      key: `v-${v}`,
      label: `${v} кВ`,
      onRemove: () => toggleNum("voltages", v),
    })
  );
  if (filters.inStockOnly) {
    chips.push({
      key: "stock",
      label: "Только в наличии",
      onRemove: () => update((prev) => ({ ...prev, inStockOnly: false })),
    });
  }
  if (filters.priceMin !== null || filters.priceMax !== null) {
    const from = filters.priceMin !== null ? `от ${filters.priceMin}` : "";
    const to = filters.priceMax !== null ? `до ${filters.priceMax}` : "";
    chips.push({
      key: "price",
      label: `Цена ${from} ${to} ₸`.replace(/\s+/g, " ").trim(),
      onRemove: () => update((prev) => ({ ...prev, priceMin: null, priceMax: null })),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-steel-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
        >
          {chip.label}
          <X className="size-3" />
        </button>
      ))}
    </div>
  );
}
