import "server-only";

import { prisma } from "@/lib/prisma";
import { productInclude } from "@/server/repositories/types";

/**
 * ProductRepository — the only place that talks to Prisma for products.
 * Returns raw Prisma rows; mapping to DTOs happens in the service layer.
 */
export const productRepository = {
  findMany() {
    return prisma.product.findMany({
      where: { published: true },
      include: productInclude,
    });
  },

  findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, published: true },
      include: productInclude,
    });
  },

  findByCategory(categorySlug: string) {
    return prisma.product.findMany({
      where: { published: true, category: { slug: categorySlug } },
      include: productInclude,
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
