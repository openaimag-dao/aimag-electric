import type {
  AttributeDef,
  CatalogFilters,
  CatalogProduct,
  FacetOption,
  SortKey,
} from "@/types/catalog";
import { PAGE_SIZE } from "@/config/catalog-sort";

/** Attribute keys with their own dedicated CatalogProduct field/filter UI — dynamic facets skip these. */
const FIXED_ATTRIBUTE_KEYS = new Set(["material", "cores", "crossSection", "voltage"]);

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

/** Does a single product satisfy the given filters? Price note: nulls ("по запросу") pass price bounds. */
function matches(p: CatalogProduct, f: CatalogFilters): boolean {
  if (f.q) {
    const hay = `${p.title} ${p.manufacturer} ${p.sku} ${p.category}`.toLowerCase();
    if (!hay.includes(f.q.toLowerCase().trim())) return false;
  }
  if (f.categories.length && !f.categories.includes(p.categorySlug)) return false;
  if (f.manufacturers.length && !f.manufacturers.includes(p.manufacturer)) return false;
  if (f.materials.length && (!p.material || !f.materials.includes(p.material))) return false;
  if (f.cores.length && (p.cores === null || !f.cores.includes(p.cores))) return false;
  if (
    f.crossSections.length &&
    (p.crossSection === null || !f.crossSections.includes(p.crossSection))
  )
    return false;
  if (f.voltages.length && (p.voltage === null || !f.voltages.includes(p.voltage))) return false;
  for (const [key, selected] of Object.entries(f.attrs)) {
    if (!selected.length) continue;
    const value = p.attrs?.[key];
    if (value === undefined || !selected.includes(String(value))) return false;
  }
  if (f.inStockOnly && p.availability !== "in_stock") return false;
  if (f.priceMin !== null && p.price !== null && p.price < f.priceMin) return false;
  if (f.priceMax !== null && p.price !== null && p.price > f.priceMax) return false;
  return true;
}

const sorters: Record<SortKey, (a: CatalogProduct, b: CatalogProduct) => number> = {
  popular: (a, b) => b.popularity - a.popularity,
  // null prices ("по запросу") sink to the bottom regardless of direction.
  price_asc: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
  price_desc: (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity),
  new: (a, b) => b.createdAt.localeCompare(a.createdAt),
  title: (a, b) => a.title.localeCompare(b.title, "ru"),
};

export interface CatalogResult {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
}

/** Filter → sort → paginate. Page is clamped into range. */
export function queryCatalog(all: CatalogProduct[], filters: CatalogFilters): CatalogResult {
  const filtered = all.filter((p) => matches(p, filters));
  filtered.sort(sorters[filters.sort]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page), pageCount);
  const start = (page - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);

  return { items, total, page, pageCount };
}

/**
 * Build facet options with counts. Each facet's count is computed against the
 * other active filters (its own dimension excluded) — the standard "faceted
 * search" behaviour used by DigiKey/Mouser so counts stay useful.
 */
function countFor<T extends string | number>(
  all: CatalogProduct[],
  filters: CatalogFilters,
  dimension: keyof CatalogFilters,
  pick: (p: CatalogProduct) => T | null,
  labeler: (v: T) => string,
  order: "asc" | "keep" = "keep"
): FacetOption<T>[] {
  const base: CatalogFilters = { ...filters, [dimension]: [] as unknown as never };
  const pool = all.filter((p) => matches(p, base));
  const counts = new Map<T, number>();
  for (const p of pool) {
    const v = pick(p);
    if (v === null || v === undefined) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let entries = Array.from(counts.entries()).map(([value, count]) => ({
    value,
    count,
    label: labeler(value),
  }));
  if (order === "asc") {
    entries = entries.sort((a, b) =>
      typeof a.value === "number"
        ? (a.value as number) - (b.value as number)
        : String(a.value).localeCompare(String(b.value), "ru")
    );
  } else {
    entries = entries.sort((a, b) => b.count - a.count);
  }
  return entries;
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

/** Same faceting rule as countFor, for a generic (dynamic) attribute key. */
function countForAttr(
  all: CatalogProduct[],
  filters: CatalogFilters,
  key: string,
  numeric: boolean
): FacetOption<string>[] {
  const base: CatalogFilters = { ...filters, attrs: { ...filters.attrs, [key]: [] } };
  const pool = all.filter((p) => matches(p, base));
  const counts = new Map<string, number>();
  for (const p of pool) {
    const v = p.attrs?.[key];
    if (v === undefined) continue;
    const s = String(v);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const entries = Array.from(counts.entries()).map(([value, count]) => ({
    value,
    count,
    label: value,
  }));
  return entries.sort((a, b) => (numeric ? Number(a.value) - Number(b.value) : b.count - a.count));
}

export function buildFacets(
  all: CatalogProduct[],
  filters: CatalogFilters,
  categoryNames: Record<string, string>,
  attributeDefs: AttributeDef[] = []
): CatalogFacets {
  const prices = all.map((p) => p.price).filter((v): v is number => v !== null);
  const dynamicAttributes: DynamicAttributeFacet[] = attributeDefs
    .filter((def) => !FIXED_ATTRIBUTE_KEYS.has(def.key) && def.type !== "BOOLEAN")
    .map((def) => ({
      key: def.key,
      name: def.name,
      unit: def.unit,
      options: countForAttr(all, filters, def.key, def.type === "NUMBER"),
    }))
    .filter((facet) => facet.options.length > 0);

  return {
    categories: countFor(
      all,
      filters,
      "categories",
      (p) => p.categorySlug,
      (v) => categoryNames[v] ?? v
    ),
    manufacturers: countFor(
      all,
      filters,
      "manufacturers",
      (p) => p.manufacturer,
      (v) => v
    ),
    materials: countFor(
      all,
      filters,
      "materials",
      (p) => p.material,
      (v) => v
    ),
    cores: countFor(
      all,
      filters,
      "cores",
      (p) => p.cores,
      (v) => `${v} жил.`,
      "asc"
    ),
    crossSections: countFor(
      all,
      filters,
      "crossSections",
      (p) => p.crossSection,
      (v) => `${v} мм²`,
      "asc"
    ),
    voltages: countFor(
      all,
      filters,
      "voltages",
      (p) => p.voltage,
      (v) => `${v} кВ`,
      "asc"
    ),
    dynamicAttributes,
    priceBounds: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    },
  };
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
