import { Prisma } from "@prisma/client";

import { tengeToTiyn } from "@/lib/money";
import { expandSeparatorVariants } from "@/lib/search/normalize";
import type { CatalogFilters, SortKey } from "@/types/catalog";

/**
 * Pure SQL-fragment builders for the catalog listing query (see
 * server/repositories/catalog-query.ts, the only caller). Kept dependency-free
 * of Prisma's client/"server-only" so the filter → WHERE/ORDER BY logic can be
 * unit-tested without a database — see catalog-query-builder.test.ts.
 */

/**
 * Effective price in тиын: prefer a currently-valid PROMO row, else the
 * cheapest other currently-valid row (BASE/WHOLESALE) — mirrors
 * derivePrice() in server/mappers/product.ts exactly. Price has at most one
 * row per (productId, kind) (@@unique constraint), so "cheapest of the
 * active pool" only ever has BASE and WHOLESALE to choose between once PROMO
 * is excluded.
 */
export const EFFECTIVE_PRICE_TIYN = Prisma.sql`(
  COALESCE(
    (SELECT pr.amount FROM "Price" pr WHERE pr."productId" = p.id AND pr.kind = 'PROMO'
      AND pr.amount IS NOT NULL AND pr."validFrom" <= now() AND (pr."validTo" IS NULL OR pr."validTo" >= now())),
    (SELECT MIN(pr.amount) FROM "Price" pr WHERE pr."productId" = p.id AND pr.kind != 'PROMO'
      AND pr.amount IS NOT NULL AND pr."validFrom" <= now() AND (pr."validTo" IS NULL OR pr."validTo" >= now()))
  )
)`;

/** Mirrors deriveAvailabilityFromStock's "in stock" case (see lib/availability.ts). */
export const IN_STOCK = Prisma.sql`EXISTS (
  SELECT 1 FROM "Stock" s WHERE s."productId" = p.id AND s.quantity > 0
)`;

/**
 * Mirrors the old queryCatalog's "no real photo sinks to the end" tiebreak —
 * a missing photo is a data gap, not something the customer asked to sort by.
 */
export const HAS_IMAGE = Prisma.sql`EXISTS (
  SELECT 1 FROM "ProductImage" pi WHERE pi."productId" = p.id AND pi.url IS NOT NULL
)`;

/** FROM clause shared by every catalog query — category/brand joined for slug/name filters and search. */
export const FROM = Prisma.sql`FROM "Product" p
  JOIN "Category" c ON c.id = p."categoryId"
  JOIN "Brand" b ON b.id = p."brandId"`;

/** material/cores/crossSection/voltage are themselves just Attribute rows with those keys — no separate columns. */
export function attrValueCond(key: string, values: (string | number)[]): Prisma.Sql {
  return Prisma.sql`EXISTS (
    SELECT 1 FROM "AttributeValue" av
    JOIN "Attribute" a ON a.id = av."attributeId" AND a.key = ${key}
    WHERE av."productId" = p.id
      AND COALESCE(av."valueString", av."valueNumber"::text) IN (${Prisma.join(values.map(String))})
  )`;
}

/** Every dimension the WHERE builder can be asked to skip, for facet counting (see catalog-query.ts). */
export type FilterDimension =
  | "q"
  | "categories"
  | "manufacturers"
  | "materials"
  | "cores"
  | "crossSections"
  | "voltages"
  | "inStockOnly"
  | "price"
  | `attr:${string}`;

/** Same active-filters-minus-one-dimension rule the old countFor()/countForAttr() used. */
export function buildConditions(filters: CatalogFilters, exclude?: FilterDimension): Prisma.Sql[] {
  const conds: Prisma.Sql[] = [Prisma.sql`p.published = true`];

  if (filters.q.trim() && exclude !== "q") {
    const q = filters.q.trim();
    const variants = expandSeparatorVariants(q);
    const titleOrSku = Prisma.join(
      variants.flatMap((v) => [
        Prisma.sql`p.title ILIKE ${`%${v}%`}`,
        Prisma.sql`p.sku ILIKE ${`%${v}%`}`,
      ]),
      " OR "
    );
    conds.push(
      Prisma.sql`(${titleOrSku} OR b.name ILIKE ${`%${q}%`} OR c.title ILIKE ${`%${q}%`})`
    );
  }
  if (filters.categories.length && exclude !== "categories") {
    conds.push(Prisma.sql`c.slug IN (${Prisma.join(filters.categories)})`);
  }
  if (filters.manufacturers.length && exclude !== "manufacturers") {
    conds.push(Prisma.sql`b.name IN (${Prisma.join(filters.manufacturers)})`);
  }
  if (filters.materials.length && exclude !== "materials") {
    conds.push(attrValueCond("material", filters.materials));
  }
  if (filters.cores.length && exclude !== "cores") {
    conds.push(attrValueCond("cores", filters.cores));
  }
  if (filters.crossSections.length && exclude !== "crossSections") {
    conds.push(attrValueCond("crossSection", filters.crossSections));
  }
  if (filters.voltages.length && exclude !== "voltages") {
    conds.push(attrValueCond("voltage", filters.voltages));
  }
  for (const [key, values] of Object.entries(filters.attrs)) {
    if (!values.length || exclude === `attr:${key}`) continue;
    conds.push(attrValueCond(key, values));
  }
  if (filters.inStockOnly && exclude !== "inStockOnly") {
    conds.push(IN_STOCK);
  }
  if ((filters.priceMin !== null || filters.priceMax !== null) && exclude !== "price") {
    // A null effective price ("по запросу") always passes bounds — see matches() in the old lib/catalog.ts.
    let bound = Prisma.sql`TRUE`;
    if (filters.priceMin !== null) {
      bound = Prisma.sql`${bound} AND ${EFFECTIVE_PRICE_TIYN} >= ${tengeToTiyn(filters.priceMin)}`;
    }
    if (filters.priceMax !== null) {
      bound = Prisma.sql`${bound} AND ${EFFECTIVE_PRICE_TIYN} <= ${tengeToTiyn(filters.priceMax)}`;
    }
    conds.push(Prisma.sql`(${EFFECTIVE_PRICE_TIYN} IS NULL OR (${bound}))`);
  }
  return conds;
}

export function whereSql(filters: CatalogFilters, exclude?: FilterDimension): Prisma.Sql {
  return Prisma.join(buildConditions(filters, exclude), " AND ");
}

export function orderBySql(sort: SortKey): Prisma.Sql {
  const primary =
    sort === "popular"
      ? Prisma.sql`p.popularity DESC`
      : sort === "price_asc"
        ? Prisma.sql`${EFFECTIVE_PRICE_TIYN} ASC NULLS LAST`
        : sort === "price_desc"
          ? Prisma.sql`${EFFECTIVE_PRICE_TIYN} DESC NULLS LAST`
          : sort === "new"
            ? Prisma.sql`p."createdAt" DESC`
            : Prisma.sql`p.title ASC`;
  // Photo-sink tiebreak always wins first, same as the old in-memory sort.
  return Prisma.sql`(CASE WHEN ${HAS_IMAGE} THEN 0 ELSE 1 END), ${primary}, p.id`;
}
