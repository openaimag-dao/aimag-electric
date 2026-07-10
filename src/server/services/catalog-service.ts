import "server-only";

import { cache } from "react";

import { productRepository, categoryRepository } from "@/server/repositories";
import { toCatalogDTO } from "@/server/mappers/product";
import type { CatalogProductDTO, CategoryDTO } from "@/server/dto";
import {
  queryCatalog,
  buildFacets,
  type CatalogFacets,
  type CatalogResult,
} from "@/lib/catalog";
import type { CatalogFilters } from "@/types/catalog";

/**
 * CatalogService — orchestrates repositories + pure query logic. Uses React
 * `cache` so a single request reuses one DB round-trip across the page,
 * facets, and count.
 */

const loadProducts = cache(async (): Promise<CatalogProductDTO[]> => {
  const rows = await productRepository.findMany();
  return rows.map(toCatalogDTO);
});

const loadCategories = cache(async (): Promise<CategoryDTO[]> => {
  const rows = await categoryRepository.findMany();
  return rows.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    spec: c.spec,
    icon: c.icon,
  }));
});

export const catalogService = {
  loadProducts,
  loadCategories,

  async getCategoryNames(): Promise<Record<string, string>> {
    const cats = await loadCategories();
    return Object.fromEntries(cats.map((c) => [c.slug, c.title]));
  },

  /** Filtered + sorted + paginated result set for the catalog grid. */
  async query(filters: CatalogFilters): Promise<CatalogResult> {
    const products = await loadProducts();
    return queryCatalog(products, filters);
  },

  /** Facet options with live counts for the filter sidebar. */
  async facets(filters: CatalogFilters): Promise<CatalogFacets> {
    const [products, names] = await Promise.all([
      loadProducts(),
      this.getCategoryNames(),
    ]);
    return buildFacets(products, filters, names);
  },

  async count(): Promise<number> {
    return productRepository.countPublished();
  },
};
