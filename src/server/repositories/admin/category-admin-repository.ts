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
  /**
   * Reassigns every product from `fromId` to `toId`, then deletes the now-
   * empty `fromId` category — atomically, so a failure partway through
   * never leaves products orphaned or the source category half-emptied.
   */
  async mergeInto(fromId: string, toId: string) {
    const [{ count }] = await prisma.$transaction([
      prisma.product.updateMany({ where: { categoryId: fromId }, data: { categoryId: toId } }),
      prisma.category.delete({ where: { id: fromId } }),
    ]);
    return { productsMoved: count };
  },
};
