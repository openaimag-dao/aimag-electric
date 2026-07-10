import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const include = {
  product: { select: { id: true, title: true, sku: true } },
} satisfies Prisma.ProductDocumentInclude;

export const documentAdminRepository = {
  list() {
    return prisma.productDocument.findMany({
      orderBy: [{ productId: "asc" }, { order: "asc" }],
      include,
    });
  },
  byId(id: string) {
    return prisma.productDocument.findUnique({ where: { id }, include });
  },
  create(data: Prisma.ProductDocumentCreateInput) {
    return prisma.productDocument.create({ data });
  },
  update(id: string, data: Prisma.ProductDocumentUpdateInput) {
    return prisma.productDocument.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.productDocument.delete({ where: { id } });
  },
};

export type DocumentAdminRow = Prisma.ProductDocumentGetPayload<{ include: typeof include }>;
