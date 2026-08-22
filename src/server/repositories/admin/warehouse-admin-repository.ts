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
  byIdWithStock(id: string) {
    return prisma.warehouse.findUnique({
      where: { id },
      include: {
        stock: {
          orderBy: { quantity: "desc" },
          include: {
            product: { select: { id: true, slug: true, sku: true, title: true, unit: true } },
          },
        },
      },
    });
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
  updateStockQuantity(stockId: string, quantity: number) {
    return prisma.stock.update({ where: { id: stockId }, data: { quantity } });
  },
};
