import "server-only";

import { prisma } from "@/lib/prisma";
import { productInclude, productListSelect } from "@/server/repositories/types";

/**
 * ProductRepository — the only place that talks to Prisma for products.
 * Returns raw Prisma rows; mapping to DTOs happens in the service layer.
 */
export const productRepository = {
  /** Lean rows for the catalog grid/facets — see productListSelect. */
  findMany() {
    return prisma.product.findMany({
      where: { published: true },
      select: productListSelect,
    });
  },

  findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, published: true },
      include: productInclude,
    });
  },

  /**
   * Candidate pool for "related products": the most popular items in the
   * category, capped so a large category doesn't pull hundreds of rows just
   * to pick the nearest few by spec distance in the service layer.
   */
  findByCategory(categorySlug: string, take = 50) {
    return prisma.product.findMany({
      where: { published: true, category: { slug: categorySlug } },
      select: productListSelect,
      orderBy: { popularity: "desc" },
      take,
    });
  },

  allSlugs() {
    return prisma.product.findMany({
      where: { published: true },
      select: { slug: true },
    });
  },

  countPublished() {
    return prisma.product.count({ where: { published: true } });
  },
};
