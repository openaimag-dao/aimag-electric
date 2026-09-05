"use client";

import { PackageX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { useCatalogFilters } from "@/hooks/use-catalog-filters";
import { emptyFilters } from "@/lib/catalog";

export function CatalogEmptyState() {
  const { filters, commit } = useCatalogFilters();
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-secondary text-steel-500">
        <PackageX className="size-7" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-primary">Ничего не найдено</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Под выбранные фильтры нет позиций. Сбросьте часть условий или отправьте запрос — подберём
        аналог под ваш проект.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={() => commit({ ...emptyFilters, sort: filters.sort })}>
          Сбросить фильтры
        </Button>
        <QuoteDialog triggerLabel="Запросить подбор" analyticsSource="catalog_empty_state" />
      </div>
    </div>
  );
}
