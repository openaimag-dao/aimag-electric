import "server-only";

import { cache } from "react";

import { productRepository, categoryRepository, attributeRepository } from "@/server/repositories";
import { toCatalogDTO } from "@/server/mappers/product";
import type { CatalogProductDTO, CategoryDTO } from "@/server/dto";
import { queryCatalog, buildFacets, type CatalogFacets, type CatalogResult } from "@/lib/catalog";
import type { AttributeDef, CatalogFilters } from "@/types/catalog";

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

const loadAttributes = cache(async (): Promise<AttributeDef[]> => {
  const rows = await attributeRepository.findFilterable();
  return rows.map((a) => ({
    key: a.key,
    name: a.name,
    unit: a.unit,
    type: a.type,
    order: a.order,
  }));
});

export const catalogService = {
  loadProducts,
  loadCategories,
  loadAttributes,

  async getCategoryNames(): Promise<Record<string, string>> {
    const cats = await loadCategories();
    return Object.fromEntries(cats.map((c) => [c.slug, c.title]));
  },

  /** Filtered + sorted + paginated result set for the catalog grid. */
  async query(filters: CatalogFilters): Promise<CatalogResult> {
    const products = await loadProducts();
    return queryCatalog(products, filters);
  },

  /** Live search suggestions (autocomplete) — queried directly in the DB, not the full in-memory catalog. */
  async searchSuggestions(query: string, limit = 6): Promise<CatalogProductDTO[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const rows = await productRepository.search(q, limit);
    return rows.map(toCatalogDTO);
  },

  /** Facet options with live counts for the filter sidebar. */
  async facets(filters: CatalogFilters): Promise<CatalogFacets> {
    const [products, names, attributeDefs] = await Promise.all([
      loadProducts(),
      this.getCategoryNames(),
      loadAttributes(),
    ]);
    return buildFacets(products, filters, names, attributeDefs);
  },

  async count(): Promise<number> {
    return productRepository.countPublished();
  },
};
