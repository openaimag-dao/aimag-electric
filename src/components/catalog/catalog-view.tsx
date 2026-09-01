"use client";

import * as React from "react";

import { buildFacets, queryCatalog, activeFilterCount } from "@/lib/catalog";
import { useCatalogFilters } from "@/hooks/use-catalog-filters";
import { logCatalogSearch } from "@/server/actions/search-actions";
import { getProductsByIds } from "@/server/actions/product-lookup-actions";
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

  // The catalog grid loads every published product once, unpaginated — see
  // catalog-service.ts — so a logged-in company member's negotiated
  // CompanyPrice can't be bulk-resolved for all of them without wasting
  // work on rows no one will scroll to. Resolve it only for the current
  // page's ids instead, reusing the same lookup /compare uses.
  const visibleIds = React.useMemo(() => items.map((p) => p.id), [items]);
  const [companyPrices, setCompanyPrices] = React.useState<Map<string, number | null>>(new Map());
  React.useEffect(() => {
    if (visibleIds.length === 0) return;
    let cancelled = false;
    getProductsByIds(visibleIds).then((rows) => {
      if (cancelled) return;
      setCompanyPrices((prev) => {
        const next = new Map(prev);
        for (const row of rows) next.set(row.id, row.companyPriceTenge ?? null);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [visibleIds]);
  const displayItems = React.useMemo(
    () =>
      items.map((p) =>
        companyPrices.has(p.id) ? { ...p, companyPriceTenge: companyPrices.get(p.id) } : p
      ),
    [items, companyPrices]
  );

  // `q` only ever changes via a full navigation from the header search box
  // (never live-typed on this page), so logging once per distinct query text
  // — not on every unrelated filter/page tweak — mirrors a real search event.
  const loggedQueryRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const q = filters.q.trim();
    if (!q || loggedQueryRef.current === q) return;
    loggedQueryRef.current = q;
    logCatalogSearch(q, total);
  }, [filters.q, total]);

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
              {displayItems.map((product, i) => (
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
