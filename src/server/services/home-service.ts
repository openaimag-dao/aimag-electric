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
  categories: cache(loadCategories),
  brands: cache(loadBrands),
  popularProducts: cache((limit = 8) => loadPopular(limit)),
};
