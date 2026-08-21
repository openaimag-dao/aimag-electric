import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const include = {
  product: { select: { id: true, title: true, sku: true } },
} satisfies Prisma.ProductImageInclude;

export const productImageAdminRepository = {
  list() {
    return prisma.productImage.findMany({
      orderBy: [{ productId: "asc" }, { order: "asc" }],
      include,
    });
  },
  byId(id: string) {
    return prisma.productImage.findUnique({ where: { id }, include });
  },
  listForProduct(productId: string) {
    return prisma.productImage.findMany({ where: { productId }, orderBy: { order: "asc" } });
  },
  create(data: Prisma.ProductImageCreateInput) {
    return prisma.productImage.create({ data });
  },
  update(id: string, data: Prisma.ProductImageUpdateInput) {
    return prisma.productImage.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.productImage.delete({ where: { id } });
  },
};

export type ProductImageAdminRow = Prisma.ProductImageGetPayload<{ include: typeof include }>;
