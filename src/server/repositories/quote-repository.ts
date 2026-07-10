import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const quoteRepository = {
  create(data: Prisma.QuoteCreateInput) {
    return prisma.quote.create({ data });
  },
  findRecent(take = 50) {
    return prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { items: true },
    });
  },
};
