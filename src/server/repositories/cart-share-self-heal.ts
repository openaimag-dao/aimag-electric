import "server-only";

import { tableSelfHeal } from "@/lib/db-self-heal";

/** CartShare is a brand-new table — created at runtime on first query, same reasoning as the other new tables this session. */
export const withCartShareTable = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "CartShare" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CartShare_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CartShare_code_key" ON "CartShare"("code")`,
]);
