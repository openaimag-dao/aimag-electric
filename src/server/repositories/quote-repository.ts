import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { withQuoteColumns } from "@/server/repositories/quote-self-heal";

export const quoteRepository = {
  create(data: Prisma.QuoteCreateInput) {
    return withQuoteColumns(() => prisma.quote.create({ data }));
  },
  findRecent(take = 50) {
    return withQuoteColumns(() =>
      prisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        take,
        include: { items: true },
      })
    );
  },
  /** Public lookup for the /kp/[token] approval page — never exposes internal ids to the client. */
  findByToken(token: string) {
    return withQuoteColumns(() =>
      prisma.quote.findUnique({
        where: { approvalToken: token },
        include: { items: true },
      })
    );
  },
  /** Only transitions a quote that is currently SENT — returns false if it was already responded to (or never sent). */
  async respond(
    token: string,
    status: "WON" | "LOST" | "IN_PROGRESS",
    note: string | null
  ): Promise<boolean> {
    return withQuoteColumns(async () => {
      const result = await prisma.quote.updateMany({
        where: { approvalToken: token, status: "SENT" },
        data: { status, respondedAt: new Date(), responseNote: note },
      });
      return result.count > 0;
    });
  },
};
