import "server-only";

import { columnSelfHeal } from "@/lib/db-self-heal";

/**
 * Product is an existing, heavily-queried table — unlike a fully-new table,
 * adding a column here risks any call site that returns full rows (`include`,
 * or a bare `create`/`update`/`delete` result) hitting "column does not
 * exist" until this runs. Wrapped around every such prisma.product.* call
 * site (see the imports of this file) — same approach as quote-self-heal.ts.
 * Call sites using an explicit `select` that doesn't list `isFeatured` are
 * unaffected and don't need wrapping.
 */
export const withProductColumns = columnSelfHeal(
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false`
);
