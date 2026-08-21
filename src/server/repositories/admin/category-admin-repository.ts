import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { columnSelfHeal } from "@/lib/db-self-heal";

const withImageColumn = columnSelfHeal(
  `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "image" TEXT`
);

export const categoryAdminRepository = {
  list() {
    return withImageColumn(() =>
      prisma.category.findMany({
        orderBy: { order: "asc" },
        include: { _count: { select: { products: true } } },
      })
    );
  },
  byId(id: string) {
    return withImageColumn(() => prisma.category.findUnique({ where: { id } }));
  },
  create(data: Prisma.CategoryCreateInput) {
    return withImageColumn(() => prisma.category.create({ data }));
  },
  update(id: string, data: Prisma.CategoryUpdateInput) {
    return withImageColumn(() => prisma.category.update({ where: { id }, data }));
  },
  remove(id: string) {
    return prisma.category.delete({ where: { id } });
  },
  countProducts(id: string) {
    return prisma.product.count({ where: { categoryId: id } });
  },
};
