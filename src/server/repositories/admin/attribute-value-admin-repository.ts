import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const include = {
  product: { select: { id: true, title: true, sku: true } },
  attribute: { select: { id: true, key: true, name: true, unit: true, type: true } },
} satisfies Prisma.AttributeValueInclude;

export const attributeValueAdminRepository = {
  list() {
    return prisma.attributeValue.findMany({
      orderBy: [{ product: { title: "asc" } }, { attribute: { order: "asc" } }],
      include,
    });
  },
  byId(id: string) {
    return prisma.attributeValue.findUnique({ where: { id }, include });
  },
  create(data: Prisma.AttributeValueCreateInput) {
    return prisma.attributeValue.create({ data });
  },
  update(id: string, data: Prisma.AttributeValueUpdateInput) {
    return prisma.attributeValue.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.attributeValue.delete({ where: { id } });
  },
};

export type AttributeValueAdminRow = Prisma.AttributeValueGetPayload<{ include: typeof include }>;
