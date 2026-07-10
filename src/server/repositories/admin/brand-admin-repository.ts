import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const brandAdminRepository = {
  list() {
    return prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
  },
  byId(id: string) {
    return prisma.brand.findUnique({ where: { id } });
  },
  create(data: Prisma.BrandCreateInput) {
    return prisma.brand.create({ data });
  },
  update(id: string, data: Prisma.BrandUpdateInput) {
    return prisma.brand.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.brand.delete({ where: { id } });
  },
  countProducts(id: string) {
    return prisma.product.count({ where: { brandId: id } });
  },
};
