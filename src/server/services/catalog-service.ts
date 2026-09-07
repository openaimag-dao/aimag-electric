import "server-only";

import { cache } from "react";

import { productRepository, categoryRepository, attributeRepository } from "@/server/repositories";
import {
  findCatalogPageIds,
  findPriceBoundsTenge,
  facetCategories,
  facetManufacturers,
  facetAttribute,
  type RawFacetRow,
} from "@/server/repositories/catalog-query";
import { toCatalogDTO } from "@/server/mappers/product";
import type { CatalogProductDTO, CategoryDTO } from "@/server/dto";
import {
  emptyFilters,
  FIXED_ATTRIBUTE_KEYS,
  type CatalogFacets,
  type CatalogResult,
  type DynamicAttributeFacet,
} from "@/lib/catalog";
import type { AttributeDef, CatalogFilters, FacetOption } from "@/types/catalog";

/**
 * CatalogService — orchestrates repositories + the SQL query layer
 * (server/repositories/catalog-query.ts). Uses React `cache` so a single
 * request reuses one DB round-trip for data shared across the page (all
 * categories/attribute defs), not the product listing itself, which is
 * always fetched per-filter-state — see catalog-query.ts for why.
 */

const loadCategories = cache(async (): Promise<CategoryDTO[]> => {
  const rows = await categoryRepository.findMany();
  return rows.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    spec: c.spec,
    icon: c.icon,
    image: c.image,
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

function toOptions(
  rows: RawFacetRow[],
  labeler: (v: string) => string,
  order: "asc" | "count" = "count"
): FacetOption<string>[] {
  const entries = rows.map((r) => ({ value: r.value, count: r.count, label: labeler(r.value) }));
  return order === "asc"
    ? entries.sort((a, b) => Number(a.value) - Number(b.value))
    : entries.sort((a, b) => b.count - a.count);
}

function toNumericOptions(
  rows: RawFacetRow[],
  labeler: (v: number) => string
): FacetOption<number>[] {
  return rows
    .map((r) => ({ value: Number(r.value), count: r.count, label: labeler(Number(r.value)) }))
    .sort((a, b) => a.value - b.value);
}

export const catalogService = {
  loadCategories,
  loadAttributes,

  async getCategoryNames(): Promise<Record<string, string>> {
    const cats = await loadCategories();
    return Object.fromEntries(cats.map((c) => [c.slug, c.title]));
  },

  /**
   * Filtered + sorted + paginated result set for the catalog grid. The SQL
   * layer only decides which ids belong on this page, in what order — the
   * actual DTOs (price, availability, images) are built by the same
   * findByIds + toCatalogDTO pipeline every other listing uses, so this can
   * never disagree with the product page on what a price or stock badge is.
   */
  async query(filters: CatalogFilters = emptyFilters): Promise<CatalogResult> {
    const { ids, total, page, pageCount } = await findCatalogPageIds(filters);
    if (ids.length === 0) return { items: [], total, page, pageCount };
    const rows = await productRepository.findByIds(ids);
    const byId = new Map(rows.map((r) => [r.id, r]));
    const items = ids
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map(toCatalogDTO);
    return { items, total, page, pageCount };
  },

  /** Live search suggestions (autocomplete) — queried directly in the DB, not the full in-memory catalog. */
  async searchSuggestions(query: string, limit = 6): Promise<CatalogProductDTO[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const rows = await productRepository.search(q, limit);
    return rows.map(toCatalogDTO);
  },

  /** Facet options with live counts for the filter sidebar — each dimension's count ignores its own active selection, same rule the old in-memory version used. */
  async facets(filters: CatalogFilters = emptyFilters): Promise<CatalogFacets> {
    const [
      names,
      attributeDefs,
      categories,
      manufacturers,
      materials,
      cores,
      crossSections,
      voltages,
      priceBounds,
    ] = await Promise.all([
      this.getCategoryNames(),
      loadAttributes(),
      facetCategories(filters),
      facetManufacturers(filters),
      facetAttribute(filters, "material", "materials"),
      facetAttribute(filters, "cores", "cores"),
      facetAttribute(filters, "crossSection", "crossSections"),
      facetAttribute(filters, "voltage", "voltages"),
      findPriceBoundsTenge(),
    ]);

    const dynamicDefs = attributeDefs.filter(
      (def) => !FIXED_ATTRIBUTE_KEYS.has(def.key) && def.type !== "BOOLEAN"
    );
    const dynamicAttributes: DynamicAttributeFacet[] = (
      await Promise.all(
        dynamicDefs.map(async (def) => {
          const rows = await facetAttribute(filters, def.key, `attr:${def.key}`);
          const options =
            def.type === "NUMBER"
              ? toOptions(rows, (v) => v, "asc")
              : toOptions(rows, (v) => v, "count");
          return { key: def.key, name: def.name, unit: def.unit, options };
        })
      )
    ).filter((facet) => facet.options.length > 0);

    return {
      categories: toOptions(categories, (v) => names[v] ?? v),
      manufacturers: toOptions(manufacturers, (v) => v),
      materials: toOptions(materials, (v) => v),
      cores: toNumericOptions(cores, (v) => `${v} жил.`),
      crossSections: toNumericOptions(crossSections, (v) => `${v} мм²`),
      voltages: toNumericOptions(voltages, (v) => `${v} кВ`),
      dynamicAttributes,
      priceBounds,
    };
  },

  async count(): Promise<number> {
    return productRepository.countPublished();
  },
};
