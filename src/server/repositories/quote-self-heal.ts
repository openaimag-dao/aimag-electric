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
  `CREATE UNIQUE INDEX IF NOT EXISTS "Quote_approvalToken_key" ON "Quote"("approvalToken")`,
]);

/** QuoteAttachment is a brand-new table — created at runtime on first query, same reasoning as withQuoteColumns above. */
export const withQuoteAttachmentsTable = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "QuoteAttachment" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteAttachment_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "QuoteAttachment_quoteId_idx" ON "QuoteAttachment"("quoteId")`,
  `ALTER TABLE "QuoteAttachment" ADD CONSTRAINT "QuoteAttachment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
]);
