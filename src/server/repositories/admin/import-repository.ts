import "server-only";

import { prisma } from "@/lib/prisma";

/** Loads the reference snapshot the validator needs to resolve relations. */
export const importRepository = {
  async loadContext() {
    const [categories, brands, products, warehouses, attributes] = await Promise.all([
      prisma.category.findMany({ select: { slug: true, title: true } }),
      prisma.brand.findMany({ select: { slug: true, name: true } }),
      prisma.product.findMany({ select: { sku: true } }),
      prisma.warehouse.findMany({ select: { code: true, name: true } }),
      prisma.attribute.findMany({ select: { key: true, type: true } }),
    ]);
    return { categories, brands, products, warehouses, attributes };
  },

  categoryIdBySlug() {
    return prisma.category.findMany({ select: { id: true, slug: true } });
  },
  brandIdBySlug() {
    return prisma.brand.findMany({ select: { id: true, slug: true } });
  },
  productIdBySku() {
    return prisma.product.findMany({ select: { id: true, sku: true } });
  },
  warehouseIdByCode() {
    return prisma.warehouse.findMany({ select: { id: true, code: true } });
  },
};
