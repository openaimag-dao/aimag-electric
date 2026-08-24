-- Documentation only — this DB has no _prisma_migrations history (schema
-- ships via `db push` / manual DDL). The actual production schema change is
-- applied by the self-heal in src/server/repositories/search-log-repository.ts.

CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "resultCount" INTEGER,
    "productSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SearchLog_query_idx" ON "SearchLog"("query");
CREATE INDEX "SearchLog_kind_idx" ON "SearchLog"("kind");
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");
