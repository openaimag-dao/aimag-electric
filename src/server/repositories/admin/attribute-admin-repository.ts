import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const attributeAdminRepository = {
  list() {
    return prisma.attribute.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { values: true } } },
    });
  },
  byId(id: string) {
    return prisma.attribute.findUnique({ where: { id } });
  },
  create(data: Prisma.AttributeCreateInput) {
    return prisma.attribute.create({ data });
  },
  update(id: string, data: Prisma.AttributeUpdateInput) {
    return prisma.attribute.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.attribute.delete({ where: { id } });
  },
  countValues(id: string) {
    return prisma.attributeValue.count({ where: { attributeId: id } });
  },
};
