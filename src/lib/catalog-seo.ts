import { filtersToParams } from "@/lib/catalog-url";
import type { CatalogFilters } from "@/types/catalog";

/** Index category listings and their pages; keep arbitrary search/filter combinations out. */
export function catalogSeo(filters: CatalogFilters, categoryExists: boolean) {
  const indexable =
    !filters.q.trim() &&
    (filters.categories.length === 0 || (filters.categories.length === 1 && categoryExists)) &&
    !filters.manufacturers.length &&
    !filters.materials.length &&
    !filters.cores.length &&
    !filters.crossSections.length &&
    !filters.voltages.length &&
    !Object.values(filters.attrs).some((values) => values.length) &&
    filters.priceMin === null &&
    filters.priceMax === null &&
    !filters.inStockOnly &&
    filters.sort === "popular";
  const query = filtersToParams(filters).toString();

  return {
    canonical: query ? `/catalog?${query}` : "/catalog",
    indexable,
    robots: {
      index: indexable,
      follow: true,
      // Override the root layout's explicit googleBot.index as well.
      googleBot: { index: indexable, follow: true, "max-image-preview": "large" as const },
    },
  };
}
