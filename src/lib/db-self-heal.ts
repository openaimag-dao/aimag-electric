import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * This DB has no _prisma_migrations history — schema changes ship via
 * `db push` or manual DDL, not `migrate deploy`, so a deploy can land a
 * Prisma field whose column was never actually created against production
 * (see prisma/migrations/*, kept for documentation only). Wrap a query with
 * an idempotent ALTER TABLE and retry once instead of depending on someone
 * running the migration by hand — same approach already proven for the
 * Notification table.
 */
export function columnSelfHeal(ddl: string) {
  let ensured = false;

  async function ensure() {
    if (ensured) return;
    try {
      await prisma.$executeRawUnsafe(ddl);
    } catch (e) {
      // Concurrent serverless invocations can race to add the same column —
      // the loser's "already exists" is fine, the column is there either way.
      if (!(e instanceof Error && /already exists/.test(e.message))) throw e;
    }
    ensured = true;
  }

  function isMissingColumn(e: unknown) {
    return e instanceof Error && /column .* does not exist/i.test(e.message);
  }

  return async function withSelfHeal<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (!isMissingColumn(e)) throw e;
      await ensure();
      return fn();
    }
  };
}
