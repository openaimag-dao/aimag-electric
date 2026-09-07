import type { CatalogFilters, FacetOption } from "@/types/catalog";

/** Attribute keys with their own dedicated CatalogProduct field/filter UI — dynamic facets skip these. */
export const FIXED_ATTRIBUTE_KEYS = new Set(["material", "cores", "crossSection", "voltage"]);

export const emptyFilters: CatalogFilters = {
  q: "",
  categories: [],
  manufacturers: [],
  materials: [],
  cores: [],
  crossSections: [],
  voltages: [],
  attrs: {},
  priceMin: null,
  priceMax: null,
  inStockOnly: false,
  sort: "popular",
  page: 1,
};

export interface CatalogResult {
  items: import("@/types/catalog").CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
}

export interface DynamicAttributeFacet {
  key: string;
  name: string;
  unit: string | null;
  options: FacetOption<string>[];
}

export interface CatalogFacets {
  categories: FacetOption[];
  manufacturers: FacetOption[];
  materials: FacetOption[];
  cores: FacetOption<number>[];
  crossSections: FacetOption<number>[];
  voltages: FacetOption<number>[];
  /** One section per filterable attribute beyond the four fixed ones — only those with real values in the current pool. */
  dynamicAttributes: DynamicAttributeFacet[];
  priceBounds: { min: number; max: number };
}

/** Count of active (non-default) filter facets — for the "Сбросить" affordance. */
export function activeFilterCount(f: CatalogFilters): number {
  return (
    f.categories.length +
    f.manufacturers.length +
    f.materials.length +
    f.cores.length +
    f.crossSections.length +
    f.voltages.length +
    Object.values(f.attrs).reduce((sum, v) => sum + v.length, 0) +
    (f.inStockOnly ? 1 : 0) +
    (f.priceMin !== null || f.priceMax !== null ? 1 : 0) +
    (f.q ? 1 : 0)
  );
}
