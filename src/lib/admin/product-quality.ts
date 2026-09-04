import type { Prisma } from "@prisma/client";

/** Real, checkable data-quality gaps — shared between the dashboard counters and the products list filter. */
export type ProductQualityFilter =
  "no-image" | "no-price" | "no-specs" | "no-description" | "no-documents";

export const QUALITY_FILTERS: ProductQualityFilter[] = [
  "no-image",
  "no-price",
  "no-specs",
  "no-description",
  "no-documents",
];

export const QUALITY_FILTER_LABELS: Record<ProductQualityFilter, string> = {
  "no-image": "Без фото",
  "no-price": "Без цены",
  "no-specs": "Без характеристик",
  "no-description": "Без описания",
  "no-documents": "Без документов",
};

export function qualityWhere(filter: ProductQualityFilter): Prisma.ProductWhereInput {
  switch (filter) {
    case "no-image":
      // Not just "zero image rows" — a product can have ProductImage rows
      // that are placeholders with no real url yet (e.g. freshly seeded
      // data), which should still count as missing a photo.
      return { images: { none: { AND: [{ url: { not: null } }, { NOT: { url: "" } }] } } };
    case "no-price":
      return { prices: { none: { kind: "BASE", amount: { not: null } } } };
    case "no-specs":
      return { values: { none: {} } };
    case "no-description":
      return { OR: [{ description: null }, { description: "" }] };
    case "no-documents":
      return { documents: { none: {} } };
  }
}
