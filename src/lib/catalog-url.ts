import type { CatalogFilters, SortKey } from "@/types/catalog";
import { emptyFilters } from "@/lib/catalog";

const SORT_KEYS: SortKey[] = ["popular", "price_asc", "price_desc", "new", "title"];

function numList(v: string | null): number[] {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => Number(x))
    .filter((x) => !Number.isNaN(x));
}

function strList(v: string | null): string[] {
  return v ? v.split(",").filter(Boolean) : [];
}

/** Parse filters from URL search params. Unknown/absent → defaults. */
export function parseFilters(params: URLSearchParams): CatalogFilters {
  const sortRaw = params.get("sort") as SortKey | null;
  const sort = sortRaw && SORT_KEYS.includes(sortRaw) ? sortRaw : "popular";
  const pageRaw = Number(params.get("page"));

  return {
    q: params.get("q") ?? "",
    categories: strList(params.get("cat")),
    manufacturers: strList(params.get("brand")),
    materials: strList(params.get("mat")),
    cores: numList(params.get("cores")),
    crossSections: numList(params.get("cs")),
    voltages: numList(params.get("v")),
    priceMin: params.get("pmin") ? Number(params.get("pmin")) : null,
    priceMax: params.get("pmax") ? Number(params.get("pmax")) : null,
    inStockOnly: params.get("stock") === "1",
    sort,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

/** Serialize filters to a compact query string (omitting defaults). */
export function filtersToParams(f: CatalogFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.categories.length) p.set("cat", f.categories.join(","));
  if (f.manufacturers.length) p.set("brand", f.manufacturers.join(","));
  if (f.materials.length) p.set("mat", f.materials.join(","));
  if (f.cores.length) p.set("cores", f.cores.join(","));
  if (f.crossSections.length) p.set("cs", f.crossSections.join(","));
  if (f.voltages.length) p.set("v", f.voltages.join(","));
  if (f.priceMin !== null) p.set("pmin", String(f.priceMin));
  if (f.priceMax !== null) p.set("pmax", String(f.priceMax));
  if (f.inStockOnly) p.set("stock", "1");
  if (f.sort !== "popular") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  return p;
}

export { emptyFilters };
