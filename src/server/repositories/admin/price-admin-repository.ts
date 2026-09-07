import "server-only";

import { Prisma } from "@prisma/client";

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

  /**
   * Multiplies the BASE price of every selected product by (1 + percent/100)
   * in one statement — a bulk "set to X" wouldn't make sense across products
   * with wildly different prices, but a proportional adjustment (a supplier
   * cost change, a seasonal markup) does. Products with no BASE row, or a
   * null ("по запросу") amount, are left untouched — there's nothing to
   * scale. Amount stays in тиын throughout, so no precision is lost.
   */
  async bulkAdjustBasePrice(productIds: string[], percent: number): Promise<{ count: number }> {
    if (productIds.length === 0) return { count: 0 };
    const factor = 1 + percent / 100;
    // Explicit ::float8 cast on the parameter — without it, some Postgres
    // clients infer the placeholder's type from the multiplication's other
    // operand (amount, an integer column) and try to bind a fractional
    // factor like 1.1 as an integer, which fails outright.
    const count = await prisma.$executeRaw`
      UPDATE "Price" SET amount = ROUND(amount * ${factor}::float8)::int
      WHERE kind = 'BASE' AND amount IS NOT NULL AND "productId" IN (${Prisma.join(productIds)})
    `;
    return { count };
  },
};

export type PriceAdminRow = Prisma.PriceGetPayload<{ include: typeof include }>;
