"use client";

import { X } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FacetCheckboxList } from "@/components/catalog/facet-checkbox-list";
import { PriceFilter } from "@/components/catalog/price-filter";
import { useCatalogFilters } from "@/hooks/use-catalog-filters";
import { activeFilterCount, emptyFilters, type CatalogFacets } from "@/lib/catalog";

const DEFAULT_OPEN = [
  "categories",
  "manufacturers",
  "price",
  "availability",
  "material",
  "cross-section",
];

export function FilterSidebar({ facets }: { facets: CatalogFacets }) {
  const { filters, update, toggle, toggleNum, toggleAttr, commit } = useCatalogFilters();
  const active = activeFilterCount(filters);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm font-semibold text-primary">Фильтры</h2>
          {active > 0 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-signal text-[11px] font-bold text-steel-950">
              {active}
            </span>
          )}
        </div>
        {active > 0 && (
          <button
            type="button"
            onClick={() => commit({ ...emptyFilters, sort: filters.sort })}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
          >
            <X className="size-3.5" />
            Сбросить
          </button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={DEFAULT_OPEN} className="px-4">
        {/* Категории */}
        <AccordionItem value="categories">
          <AccordionTrigger>Категории</AccordionTrigger>
          <AccordionContent>
            <FacetCheckboxList
              options={facets.categories}
              selected={filters.categories}
              onToggle={(v) => toggle("categories", v)}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Производители */}
        <AccordionItem value="manufacturers">
          <AccordionTrigger>Производители</AccordionTrigger>
          <AccordionContent>
            <FacetCheckboxList
              options={facets.manufacturers}
              selected={filters.manufacturers}
              onToggle={(v) => toggle("manufacturers", v)}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Цена */}
        <AccordionItem value="price">
          <AccordionTrigger>Цена, ₸</AccordionTrigger>
          <AccordionContent>
            <PriceFilter
              bounds={facets.priceBounds}
              valueMin={filters.priceMin}
              valueMax={filters.priceMax}
              onApply={(min, max) => update((prev) => ({ ...prev, priceMin: min, priceMax: max }))}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Наличие */}
        <AccordionItem value="availability">
          <AccordionTrigger>Наличие</AccordionTrigger>
          <AccordionContent>
            <label
              htmlFor="in-stock-only"
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary/70"
            >
              <Checkbox
                id="in-stock-only"
                checked={filters.inStockOnly}
                onCheckedChange={() =>
                  update((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }))
                }
              />
              <span className="text-steel-700">Только в наличии</span>
            </label>
          </AccordionContent>
        </AccordionItem>

        {/* Материал */}
        <AccordionItem value="material">
          <AccordionTrigger>Материал</AccordionTrigger>
          <AccordionContent>
            <FacetCheckboxList
              options={facets.materials}
              selected={filters.materials}
              onToggle={(v) => toggle("materials", v)}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Количество жил */}
        <AccordionItem value="cores">
          <AccordionTrigger>Количество жил</AccordionTrigger>
          <AccordionContent>
            <FacetCheckboxList
              options={facets.cores}
              selected={filters.cores}
              onToggle={(v) => toggleNum("cores", v)}
              emptyHint="Неприменимо к выбранным категориям"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Сечение */}
        <AccordionItem value="cross-section">
          <AccordionTrigger>Сечение, мм²</AccordionTrigger>
          <AccordionContent>
            <FacetCheckboxList
              options={facets.crossSections}
              selected={filters.crossSections}
              onToggle={(v) => toggleNum("crossSections", v)}
              collapseAfter={8}
              emptyHint="Неприменимо к выбранным категориям"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Напряжение */}
        <AccordionItem
          value="voltage"
          className={facets.dynamicAttributes.length ? "" : "border-b-0"}
        >
          <AccordionTrigger>Напряжение, кВ</AccordionTrigger>
          <AccordionContent>
            <FacetCheckboxList
              options={facets.voltages}
              selected={filters.voltages}
              onToggle={(v) => toggleNum("voltages", v)}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Прочие характеристики — генерируются из реально присутствующих в выборке атрибутов */}
        {facets.dynamicAttributes.map((facet, i) => (
          <AccordionItem
            key={facet.key}
            value={`attr-${facet.key}`}
            className={i === facets.dynamicAttributes.length - 1 ? "border-b-0" : ""}
          >
            <AccordionTrigger>
              {facet.name}
              {facet.unit ? `, ${facet.unit}` : ""}
            </AccordionTrigger>
            <AccordionContent>
              <FacetCheckboxList
                options={facet.options}
                selected={filters.attrs[facet.key] ?? []}
                onToggle={(v) => toggleAttr(facet.key, v)}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Separator />
      <p className="px-4 py-3 text-xs text-muted-foreground">
        Не нашли позицию? Отправьте спецификацию — подберём аналог и посчитаем КП.
      </p>
    </div>
  );
}
