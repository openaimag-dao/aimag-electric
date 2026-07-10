import "server-only";

import type { Prisma, QuoteStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const quoteAdminRepository = {
  list() {
    return prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true, _count: { select: { items: true } } },
    });
  },
  byId(id: string) {
    return prisma.quote.findUnique({ where: { id }, include: { items: true } });
  },
  updateStatus(id: string, status: QuoteStatus) {
    return prisma.quote.update({ where: { id }, data: { status } });
  },
  update(id: string, data: Prisma.QuoteUpdateInput) {
    return prisma.quote.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.quote.delete({ where: { id } });
  },
  countByStatus() {
    return prisma.quote.groupBy({ by: ["status"], _count: true });
  },
};
