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
