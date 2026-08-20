import type { Prisma } from "@prisma/client";

/** Full product graph needed to render the single-product detail view. */
export const productInclude = {
  category: true,
  brand: true,
  images: { orderBy: { order: "asc" } },
  documents: { orderBy: { order: "asc" } },
  values: { include: { attribute: true } },
  prices: true,
  stock: { include: { warehouse: true } },
  reviews: { where: { published: true }, orderBy: { createdAt: "desc" } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

/**
 * Lean product shape for listing views (catalog grid, "related products").
 * Skips documents/reviews and the full attribute/warehouse graph that only
 * the detail page needs — avoids over-fetching on every catalog request.
 */
export const productListSelect = {
  id: true,
  slug: true,
  title: true,
  sku: true,
  unit: true,
  createdAt: true,
  popularity: true,
  badge: true,
  category: { select: { slug: true, title: true } },
  brand: { select: { name: true } },
  images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
  prices: {
    select: { kind: true, amount: true, validFrom: true, validTo: true },
  },
  stock: { select: { quantity: true, restockAt: true } },
  values: {
    select: {
      valueString: true,
      valueNumber: true,
      valueBool: true,
      attribute: { select: { key: true } },
    },
    // All filterable attributes, not just the four with dedicated
    // CatalogProduct fields — new attributes staff add in /admin/attributes
    // show up in facets automatically (see toCatalogDTO's `attrs` bag and
    // buildFacets' dynamicAttributes).
    where: { attribute: { filterable: true } },
  },
} satisfies Prisma.ProductSelect;

export type ProductForListing = Prisma.ProductGetPayload<{
  select: typeof productListSelect;
}>;
