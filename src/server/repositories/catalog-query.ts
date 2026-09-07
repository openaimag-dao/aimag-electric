import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "@/config/catalog-sort";
import {
  EFFECTIVE_PRICE_TIYN,
  FROM,
  whereSql,
  orderBySql,
  type FilterDimension,
} from "@/lib/catalog-query-builder";
import type { CatalogFilters } from "@/types/catalog";

export type { FilterDimension };

/**
 * SQL-level catalog query engine. Replaces the old approach of loading every
 * published product into memory and filtering/sorting/faceting it in
 * JavaScript (fine at ~1,300 SKUs, a guaranteed outage at 100,000+) — see
 * git history on lib/catalog.ts for the code this replaced.
 *
 * Design: this module decides WHICH product ids match, in WHAT order, for
 * the current page — nothing else. The actual DTO (price, availability,
 * images, attrs) is still built by the existing, already-correct
 * productRepository.findByIds + toCatalogDTO pipeline (see catalog-service.ts),
 * so a bug here can misorder/mis-filter results but can never make the
 * listing show a different price/stock than the product page does.
 *
 * WHERE/ORDER BY fragment construction lives in lib/catalog-query-builder.ts
 * (dependency-free of Prisma's client, so it's unit-testable without a DB).
 */

export interface CatalogPageIds {
  ids: string[];
  total: number;
  page: number;
  pageCount: number;
}

/** Which ids belong on the requested (clamped) page, in the requested order — see catalogService.query(). */
export async function findCatalogPageIds(filters: CatalogFilters): Promise<CatalogPageIds> {
  const where = whereSql(filters);
  const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>(
    Prisma.sql`SELECT COUNT(*)::bigint AS count ${FROM} WHERE ${where}`
  );
  const total = Number(count);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page), pageCount);
  const offset = (page - 1) * PAGE_SIZE;

  if (total === 0) return { ids: [], total, page, pageCount };

  const rows = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT p.id ${FROM} WHERE ${where} ORDER BY ${orderBySql(filters.sort)} LIMIT ${PAGE_SIZE} OFFSET ${offset}`
  );
  return { ids: rows.map((r) => r.id), total, page, pageCount };
}

/** Global min/max effective price across the whole published catalog — the old buildFacets() never scoped this to active filters either. */
export async function findPriceBoundsTenge(): Promise<{ min: number; max: number }> {
  const [row] = await prisma.$queryRaw<{ min: number | null; max: number | null }[]>(
    Prisma.sql`SELECT MIN(${EFFECTIVE_PRICE_TIYN}) AS min, MAX(${EFFECTIVE_PRICE_TIYN}) AS max ${FROM} WHERE p.published = true`
  );
  return {
    min: row?.min ? Math.round(row.min / 100) : 0,
    max: row?.max ? Math.round(row.max / 100) : 0,
  };
}

export interface RawFacetRow {
  value: string;
  count: number;
}

/** Category facet: value = Category.slug (matches CatalogFilters.categories). */
export async function facetCategories(filters: CatalogFilters): Promise<RawFacetRow[]> {
  const rows = await prisma.$queryRaw<{ value: string; count: bigint }[]>(
    Prisma.sql`SELECT c.slug AS value, COUNT(*)::bigint AS count ${FROM} WHERE ${whereSql(filters, "categories")} GROUP BY c.slug`
  );
  return rows.map((r) => ({ value: r.value, count: Number(r.count) }));
}

/** Manufacturer facet: value = Brand.name (matches CatalogFilters.manufacturers). */
export async function facetManufacturers(filters: CatalogFilters): Promise<RawFacetRow[]> {
  const rows = await prisma.$queryRaw<{ value: string; count: bigint }[]>(
    Prisma.sql`SELECT b.name AS value, COUNT(*)::bigint AS count ${FROM} WHERE ${whereSql(filters, "manufacturers")} GROUP BY b.name`
  );
  return rows.map((r) => ({ value: r.value, count: Number(r.count) }));
}

/** Any Attribute-backed facet (material/cores/crossSection/voltage or a dynamic admin-defined attribute), grouped by its value. */
export async function facetAttribute(
  filters: CatalogFilters,
  key: string,
  exclude: FilterDimension
): Promise<RawFacetRow[]> {
  const rows = await prisma.$queryRaw<{ value: string; count: bigint }[]>(
    Prisma.sql`SELECT COALESCE(av."valueString", av."valueNumber"::text) AS value, COUNT(*)::bigint AS count
      ${FROM}
      JOIN "AttributeValue" av ON av."productId" = p.id
      JOIN "Attribute" a ON a.id = av."attributeId" AND a.key = ${key}
      WHERE ${whereSql(filters, exclude)}
      GROUP BY value`
  );
  return rows.map((r) => ({ value: r.value, count: Number(r.count) }));
}
