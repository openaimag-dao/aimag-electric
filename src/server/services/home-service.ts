import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { productRepository, categoryRepository, brandRepository } from "@/server/repositories";
import { toCatalogDTO } from "@/server/mappers/product";
import type { CatalogProductDTO, CategoryDTO, BrandDTO } from "@/server/dto";
import { CACHE_TAGS } from "@/lib/cache-tags";

/**
 * Homepage data. Two cache layers:
 *  - unstable_cache: persistent across requests, invalidated by tag on writes.
 *  - React cache(): request-level dedupe so one render hits the store once.
 */

const loadCategories = unstable_cache(
  async (): Promise<CategoryDTO[]> => {
    const rows = await categoryRepository.findMany();
    return rows.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      spec: c.spec,
      icon: c.icon,
      image: c.image,
    }));
  },
  ["home-categories"],
  { tags: [CACHE_TAGS.categories], revalidate: 3600 }
);

const loadBrands = unstable_cache(
  async (): Promise<BrandDTO[]> => {
    const rows = await brandRepository.findMany();
    return rows.map((b) => ({ slug: b.slug, name: b.name, origin: b.origin }));
  },
  ["home-brands"],
  { tags: [CACHE_TAGS.brands], revalidate: 3600 }
);

/**
 * Homepage showcase: staff-curated `isFeatured` products first (they're the
 * ones known to have real photos/specs, not synthetic demo data), topped up
 * with the most popular products from categories not already represented —
 * so the showcase stays diverse instead of one category's top sellers
 * crowding it out — and only falls back to plain popularity if that still
 * isn't enough to fill `limit`.
 */
const loadPopular = unstable_cache(
  async (limit: number): Promise<CatalogProductDTO[]> => {
    const featured = (await productRepository.findFeatured(limit)).map(toCatalogDTO);
    if (featured.length >= limit) return featured.slice(0, limit);

    const rows = (await productRepository.findMany())
      .map(toCatalogDTO)
      .sort((a, b) => b.popularity - a.popularity);

    const result = [...featured];
    const usedIds = new Set(result.map((p) => p.id));
    const usedCategories = new Set(result.map((p) => p.categorySlug));

    for (const p of rows) {
      if (result.length >= limit) break;
      if (usedIds.has(p.id) || usedCategories.has(p.categorySlug)) continue;
      result.push(p);
      usedIds.add(p.id);
      usedCategories.add(p.categorySlug);
    }
    for (const p of rows) {
      if (result.length >= limit) break;
      if (usedIds.has(p.id)) continue;
      result.push(p);
      usedIds.add(p.id);
    }
    return result;
  },
  ["home-popular"],
  { tags: [CACHE_TAGS.products], revalidate: 600 }
);

export const homeService = {
  categories: cache(loadCategories),
  brands: cache(loadBrands),
  popularProducts: cache((limit = 8) => loadPopular(limit)),
  // Real published-product count for the hero's catalog-size stat — not a
  // hardcoded marketing number. Deliberately uncached (unstable_cache here
  // produced a stale/wrong count in production — a cheap COUNT query doesn't
  // need the persistence, and catalogService.count() proves the same query
  // is fast enough to run per-request): same pattern as that function.
  productCount: cache((): Promise<number> => productRepository.countPublished()),
};
