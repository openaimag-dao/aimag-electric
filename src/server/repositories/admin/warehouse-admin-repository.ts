import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const warehouseAdminRepository = {
  list() {
    return prisma.warehouse.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { stock: true } } },
    });
  },
  byId(id: string) {
    return prisma.warehouse.findUnique({ where: { id } });
  },
  create(data: Prisma.WarehouseCreateInput) {
    return prisma.warehouse.create({ data });
  },
  update(id: string, data: Prisma.WarehouseUpdateInput) {
    return prisma.warehouse.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.warehouse.delete({ where: { id } });
  },
};
