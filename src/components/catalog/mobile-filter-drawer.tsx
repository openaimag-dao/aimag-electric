"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import type { CatalogFacets } from "@/lib/catalog";

export function MobileFilterDrawer({
  facets,
  activeCount,
}: {
  facets: CatalogFacets;
  activeCount: number;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="size-4" />
          Фильтры
          {activeCount > 0 && (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-signal text-[11px] font-bold text-steel-950">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[88%] max-w-sm overflow-y-auto p-0">
        <div className="p-4">
          <FilterSidebar facets={facets} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
