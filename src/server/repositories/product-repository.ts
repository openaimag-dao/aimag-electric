import "server-only";

import { prisma } from "@/lib/prisma";
import { productInclude, productListSelect } from "@/server/repositories/types";
import { rankSearchResults } from "@/lib/search/rank";
import { expandSeparatorVariants } from "@/lib/search/normalize";
import { withProductColumns } from "@/server/repositories/product-self-heal";

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
    return withProductColumns(() =>
      prisma.product.findFirst({
        where: { slug, published: true },
        include: productInclude,
      })
    );
  },

  /**
   * Staff-curated homepage showcase pool. Deliberately not part of
   * `productListSelect`'s shared shape — see homeService's loadPopular for
   * the diverse-category fallback used when fewer than `limit` are featured.
   */
  findFeatured(limit: number) {
    return withProductColumns(() =>
      prisma.product.findMany({
        where: { published: true, isFeatured: true },
        select: productListSelect,
        orderBy: { popularity: "desc" },
        take: limit,
      })
    );
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

  /**
   * Substring match across title/SKU/brand/category. Fetches a wider
   * popularity-ordered pool than `take` so an exact/prefix SKU match isn't
   * clipped out before rankSearchResults can surface it above merely-popular
   * matches (see rank.ts — a customer searching by article number expects
   * that exact part first).
   *
   * title/sku are also matched against every separator variant of the query
   * (see normalize.ts) — a cross-section like "4×2.5" is stored with the
   * multiplication sign, so "4x2.5"/"4х2.5"/"4*2.5" would otherwise find
   * nothing.
   */
  async search(query: string, take = 6) {
    const variants = expandSeparatorVariants(query);
    const rows = await prisma.product.findMany({
      where: {
        published: true,
        OR: [
          ...variants.map((v) => ({ title: { contains: v, mode: "insensitive" as const } })),
          ...variants.map((v) => ({ sku: { contains: v, mode: "insensitive" as const } })),
          { brand: { name: { contains: query, mode: "insensitive" } } },
          { category: { title: { contains: query, mode: "insensitive" } } },
        ],
      },
      select: productListSelect,
      orderBy: { popularity: "desc" },
      take: Math.max(take * 5, 30),
    });
    return rankSearchResults(rows, query).slice(0, take);
  },

  allSlugs() {
    return prisma.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
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
