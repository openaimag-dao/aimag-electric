-- Documentation only — this DB has no _prisma_migrations history (schema
-- ships via `db push` / manual DDL). The actual production schema change is
-- applied by the self-heal in src/server/repositories/quote-self-heal.ts,
-- wrapped around every prisma.quote.* call site (this is an existing,
-- heavily-queried table, unlike the fully-new Company/Project tables).

ALTER TABLE "Quote" ADD COLUMN "approvalToken" TEXT;
ALTER TABLE "Quote" ADD COLUMN "respondedAt" TIMESTAMP(3);
ALTER TABLE "Quote" ADD COLUMN "responseNote" TEXT;

CREATE UNIQUE INDEX "Quote_approvalToken_key" ON "Quote"("approvalToken");
