-- Documentation only — this DB has no _prisma_migrations history (schema
-- ships via `db push` / manual DDL). The Quote column/table changes below
-- are applied by the self-heal in
-- src/server/repositories/quote-self-heal.ts. The enum values cannot be
-- self-healed the same way (an "invalid input value for enum" error at
-- write time is not caught by that self-heal's missing-column/table regex),
-- so they were applied directly against production before this code shipped.

ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'SUPPLIER_REQUEST';
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'PROPOSAL_PREP';
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'NEGOTIATION';
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "bin" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "categories" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "requestType" TEXT;

CREATE TABLE IF NOT EXISTS "QuoteDocument" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "QuoteDocument_quoteId_idx" ON "QuoteDocument"("quoteId");

ALTER TABLE "QuoteDocument" ADD CONSTRAINT "QuoteDocument_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The DB now lives on Supabase (see DATABASE_URL_UNPOOLED's host), where every
-- other table has RLS enabled with no policies (Prisma connects directly and
-- bypasses it regardless; this only matters if the table is ever exposed via
-- PostgREST/supabase-js). Match that posture so a fresh table isn't the one
-- left wide open.
ALTER TABLE "QuoteDocument" ENABLE ROW LEVEL SECURITY;
