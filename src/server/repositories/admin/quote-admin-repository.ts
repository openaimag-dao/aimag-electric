import "server-only";

import type { Prisma, QuoteStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { withQuoteColumns } from "@/server/repositories/quote-self-heal";

export const quoteAdminRepository = {
  list() {
    return withQuoteColumns(() =>
      prisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        include: { items: true, _count: { select: { items: true } } },
      })
    );
  },
  byId(id: string) {
    return withQuoteColumns(() =>
      prisma.quote.findUnique({ where: { id }, include: { items: true } })
    );
  },
  updateStatus(id: string, status: QuoteStatus) {
    return withQuoteColumns(() => prisma.quote.update({ where: { id }, data: { status } }));
  },
  update(id: string, data: Prisma.QuoteUpdateInput) {
    return withQuoteColumns(() => prisma.quote.update({ where: { id }, data }));
  },
  remove(id: string) {
    return withQuoteColumns(() => prisma.quote.delete({ where: { id } }));
  },
  countByStatus() {
    return withQuoteColumns(() => prisma.quote.groupBy({ by: ["status"], _count: true }));
  },
};
