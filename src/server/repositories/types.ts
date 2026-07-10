import type { Prisma } from "@prisma/client";

/** Full product graph needed to render catalog + detail views. */
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
