import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { productRepository, categoryRepository, brandRepository } from "@/server/repositories";
import { toCatalogDTO } from "@/server/mappers/product";
import type { CatalogProductDTO, CategoryCardDTO, BrandDTO } from "@/server/dto";
import { CACHE_TAGS } from "@/lib/cache-tags";

/**
 * Homepage data. Two cache layers:
 *  - unstable_cache: persistent across requests, invalidated by tag on writes.
 *  - React cache(): request-level dedupe so one render hits the store once.
 */

// Depends on both Category rows and Product rows/images (via
// findManyWithStats' product count + representative photo), so it's tagged
// with both — an admin edit to either kind invalidates it.
const loadCategoryCards = unstable_cache(
  async (): Promise<CategoryCardDTO[]> => {
    const rows = await categoryRepository.findManyWithStats();
    return rows.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      spec: c.spec,
      icon: c.icon,
      image: c.image,
      productCount: c.productCount,
    }));
  },
  // Key bumped (v2) alongside the null-url image-selection fix below, so the
  // fix takes effect immediately on deploy instead of waiting out the 1h TTL.
  ["home-category-cards-v2"],
  { tags: [CACHE_TAGS.categories, CACHE_TAGS.products], revalidate: 3600 }
);

const loadBrands = unstable_cache(
  async (): Promise<BrandDTO[]> => {
    const rows = await brandRepository.findMany();
    return rows.map((b) => ({ slug: b.slug, name: b.name, origin: b.origin }));
  },
  ["home-brands"],
  { tags: [CACHE_TAGS.brands], revalidate: 3600 }
);

const loadPopular = unstable_cache(
  async (limit: number): Promise<CatalogProductDTO[]> => {
    const rows = await productRepository.findMany();
    return rows
      .map(toCatalogDTO)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  },
  ["home-popular"],
  { tags: [CACHE_TAGS.products], revalidate: 600 }
);

export const homeService = {
  categoryCards: cache(loadCategoryCards),
  brands: cache(loadBrands),
  popularProducts: cache((limit = 8) => loadPopular(limit)),
  // Real published-product count for the hero's catalog-size stat — not a
  // hardcoded marketing number. Deliberately uncached (unstable_cache here
  // produced a stale/wrong count in production — a cheap COUNT query doesn't
  // need the persistence, and catalogService.count() proves the same query
  // is fast enough to run per-request): same pattern as that function.
  productCount: cache((): Promise<number> => productRepository.countPublished()),
};
