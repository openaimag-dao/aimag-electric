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

  /** Substring match across title/SKU/brand/category, most popular first. */
  search(query: string, take = 6) {
    return prisma.product.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { brand: { name: { contains: query, mode: "insensitive" } } },
          { category: { title: { contains: query, mode: "insensitive" } } },
        ],
      },
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

  /** Lookup by a client-held id list (favorites, compare, recently viewed) — order is not guaranteed here, callers re-sort to match the input. */
  findByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return prisma.product.findMany({
      where: { published: true, id: { in: ids } },
      select: productListSelect,
    });
  },

  countPublished() {
    return prisma.product.count({ where: { published: true } });
  },
};
