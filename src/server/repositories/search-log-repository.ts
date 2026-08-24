import "server-only";

import { prisma } from "@/lib/prisma";
import { tableSelfHeal } from "@/lib/db-self-heal";

const withTable = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "SearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "resultCount" INTEGER,
    "productSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "SearchLog_query_idx" ON "SearchLog"("query")`,
  `CREATE INDEX IF NOT EXISTS "SearchLog_kind_idx" ON "SearchLog"("kind")`,
  `CREATE INDEX IF NOT EXISTS "SearchLog_createdAt_idx" ON "SearchLog"("createdAt")`,
]);

export interface TopQueryRow {
  query: string;
  count: number;
}

/**
 * Real, unfabricated search-demand log — see the SearchLog model comment in
 * schema.prisma. Writes are best-effort from the caller's point of view
 * (search-actions.ts swallows failures here so a logging hiccup never breaks
 * an actual search).
 */
export const searchLogRepository = {
  logSearch(query: string, resultCount: number) {
    return withTable(() =>
      prisma.searchLog.create({ data: { query, kind: "search", resultCount } })
    );
  },

  logClick(query: string, productSlug: string) {
    return withTable(() =>
      prisma.searchLog.create({ data: { query, kind: "click", productSlug } })
    );
  },

  /** Most frequent search queries in the last `days` days. */
  async topQueries(days = 30, take = 10): Promise<TopQueryRow[]> {
    return withTable(async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const rows = await prisma.searchLog.groupBy({
        by: ["query"],
        where: { kind: "search", createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { query: "desc" } },
        take,
      });
      return rows.map((r) => ({ query: r.query, count: r._count._all }));
    });
  },

  /** Queries that returned zero results — the concrete "what are we missing" signal. */
  async topZeroResultQueries(days = 30, take = 10): Promise<TopQueryRow[]> {
    return withTable(async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const rows = await prisma.searchLog.groupBy({
        by: ["query"],
        where: { kind: "search", resultCount: 0, createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { query: "desc" } },
        take,
      });
      return rows.map((r) => ({ query: r.query, count: r._count._all }));
    });
  },
};
