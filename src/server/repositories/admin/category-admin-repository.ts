import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const categoryAdminRepository = {
  list() {
    return prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { products: true } } },
    });
  },
  byId(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },
  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },
  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.category.delete({ where: { id } });
  },
  countProducts(id: string) {
    return prisma.product.count({ where: { categoryId: id } });
  },
};
