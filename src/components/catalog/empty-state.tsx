"use client";

import Link from "next/link";
import { PackageX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { useCatalogFilters } from "@/hooks/use-catalog-filters";
import { activeFilterCount, emptyFilters } from "@/lib/catalog";

export function CatalogEmptyState() {
  const { filters, commit } = useCatalogFilters();
  const query = filters.q.trim();
  const hasFilters = activeFilterCount({ ...filters, q: "" }) > 0;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-secondary text-steel-500">
        <PackageX className="size-7" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-primary">Ничего не найдено</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {query
          ? `По запросу «${query}» нет подходящих позиций. `
          : "Под выбранные фильтры нет позиций. "}
        Измените условия или отправьте запрос — уточним возможность поставки и подбора аналога.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {hasFilters && (
          <Button
            variant="outline"
            onClick={() => commit({ ...emptyFilters, q: query, sort: filters.sort })}
          >
            {query ? "Убрать фильтры, оставить запрос" : "Сбросить фильтры"}
          </Button>
        )}
        <QuoteDialog
          triggerLabel="Запросить подбор"
          defaultMessage={
            query
              ? `Не нашёл в каталоге: «${query.slice(0, 1500)}». Прошу уточнить возможность поставки или подобрать аналог.`
              : undefined
          }
        />
        <Button asChild variant="ghost">
          <Link href="/catalog">Весь каталог</Link>
        </Button>
      </div>
    </div>
  );
}
