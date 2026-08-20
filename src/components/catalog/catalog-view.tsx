"use client";

import * as React from "react";

import { buildFacets, queryCatalog, activeFilterCount } from "@/lib/catalog";
import { useCatalogFilters } from "@/hooks/use-catalog-filters";
import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { MobileFilterDrawer } from "@/components/catalog/mobile-filter-drawer";
import { SortSelect } from "@/components/catalog/sort-select";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { ProductCard } from "@/components/catalog/product-card";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { CatalogEmptyState } from "@/components/catalog/empty-state";
import { PAGE_SIZE } from "@/config/catalog-sort";
import type { AttributeDef, CatalogProduct } from "@/types/catalog";

interface CatalogViewProps {
  products: CatalogProduct[];
  categoryNames: Record<string, string>;
  attributeDefs: AttributeDef[];
}

export function CatalogView({ products, categoryNames, attributeDefs }: CatalogViewProps) {
  const { filters } = useCatalogFilters();

  // Derived data — memoized so re-renders on unrelated state stay cheap.
  const { items, total, page, pageCount } = React.useMemo(
    () => queryCatalog(products, filters),
    [products, filters]
  );
  const facets = React.useMemo(
    () => buildFacets(products, filters, categoryNames, attributeDefs),
    [products, categoryNames, attributeDefs, filters]
  );
  const activeCount = activeFilterCount(filters);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <FilterSidebar facets={facets} />
        </div>
      </aside>

      {/* Results */}
      <div className="min-w-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <MobileFilterDrawer facets={facets} activeCount={activeCount} />
            <p className="text-sm text-muted-foreground">
              {total > 0 ? (
                <>
                  Показано{" "}
                  <span className="font-semibold text-primary">
                    {from}–{to}
                  </span>{" "}
                  из <span className="font-semibold text-primary">{total}</span>
                </>
              ) : (
                "Нет позиций"
              )}
            </p>
          </div>
          <SortSelect />
        </div>

        {/* Active chips */}
        <div className="mt-4">
          <ActiveFilterChips facets={facets} />
        </div>

        {/* Grid */}
        {items.length === 0 ? (
          <div className="mt-6">
            <CatalogEmptyState />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i === 0} />
              ))}
            </div>

            <div className="mt-10">
              <CatalogPagination page={page} pageCount={pageCount} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
