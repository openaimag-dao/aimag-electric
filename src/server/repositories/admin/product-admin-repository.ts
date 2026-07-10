import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const listInclude = {
  category: true,
  brand: true,
  prices: true,
  stock: true,
  _count: { select: { documents: true, reviews: true } },
} satisfies Prisma.ProductInclude;

export const productAdminRepository = {
  list() {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: listInclude,
    });
  },
  byId(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        prices: true,
        stock: { include: { warehouse: true } },
        documents: { orderBy: { order: "asc" } },
        values: { include: { attribute: true } },
      },
    });
  },
  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },
  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.product.delete({ where: { id } });
  },
  count() {
    return prisma.product.count();
  },
};

export type ProductAdminRow = Prisma.ProductGetPayload<{ include: typeof listInclude }>;
