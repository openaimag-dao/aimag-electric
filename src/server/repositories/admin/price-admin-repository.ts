import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const include = {
  product: { select: { id: true, title: true, sku: true, unit: true } },
} satisfies Prisma.PriceInclude;

export const priceAdminRepository = {
  list() {
    return prisma.price.findMany({
      orderBy: { validFrom: "desc" },
      include,
    });
  },
  byId(id: string) {
    return prisma.price.findUnique({ where: { id }, include });
  },
  create(data: Prisma.PriceCreateInput) {
    return prisma.price.create({ data });
  },
  update(id: string, data: Prisma.PriceUpdateInput) {
    return prisma.price.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.price.delete({ where: { id } });
  },
};

export type PriceAdminRow = Prisma.PriceGetPayload<{ include: typeof include }>;
