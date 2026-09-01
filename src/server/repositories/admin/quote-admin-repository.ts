import "server-only";

import type { Prisma, QuoteStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { withQuoteColumns } from "@/server/repositories/quote-self-heal";

export const quoteAdminRepository = {
  list() {
    return withQuoteColumns(() =>
      prisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          _count: { select: { items: true } },
          customer: {
            select: { id: true, owner: { select: { id: true, name: true, email: true } } },
          },
        },
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
  /** Staff-set line price when preparing a КП — the amount echoed back to the customer was previously frozen at whatever the cart had at submission time. */
  updateItemPrice(itemId: string, amountTiyn: number | null) {
    return withQuoteColumns(() =>
      prisma.quoteItem.update({ where: { id: itemId }, data: { amountTiyn } })
    );
  },
  countByStatus() {
    return withQuoteColumns(() => prisma.quote.groupBy({ by: ["status"], _count: true }));
  },
};
