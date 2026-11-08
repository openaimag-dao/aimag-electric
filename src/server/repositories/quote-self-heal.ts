import "server-only";

import { tableSelfHeal } from "@/lib/db-self-heal";

/**
 * Quote is an existing, heavily-queried table (submitQuote, /account, the
 * admin quotes list/dashboard, admin global search) — unlike the fully-new
 * Company/Project tables, adding columns here risks any unwrapped call site
 * hitting "column does not exist" until this runs. Wrapped around every
 * prisma.quote.* call site in the app (see the imports of this file) rather
 * than just one or two, to close that gap properly.
 */
export const withQuoteColumns = tableSelfHeal([
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "approvalToken" TEXT`,
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "responseNote" TEXT`,
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "sourcePath" TEXT`,
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "utmSource" TEXT`,
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT`,
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Quote_approvalToken_key" ON "Quote"("approvalToken")`,
  // Data-center B2B RFQ form (and any future specialized B2B flow) — see
  // schema.prisma comments on these columns.
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "bin" TEXT`,
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "region" TEXT`,
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "categories" TEXT`,
  `ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "requestType" TEXT`,
  `CREATE TABLE IF NOT EXISTS "QuoteDocument" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteDocument_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "QuoteDocument_quoteId_idx" ON "QuoteDocument"("quoteId")`,
  `ALTER TABLE "QuoteDocument" ADD CONSTRAINT "QuoteDocument_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
]);
