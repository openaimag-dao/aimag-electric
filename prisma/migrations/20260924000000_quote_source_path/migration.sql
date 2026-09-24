-- Documentation only: production schema is updated by withQuoteColumns,
-- because this database does not maintain a Prisma migration history.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "sourcePath" TEXT;
