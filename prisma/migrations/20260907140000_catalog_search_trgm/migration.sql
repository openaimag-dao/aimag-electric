-- Documentation only — this DB has no _prisma_migrations history (schema
-- ships via `db push` / manual DDL, see prisma/migrations/20260828190000_company_price).
-- Applied directly to production. Speeds up the catalog's title/SKU ILIKE
-- search (server/repositories/catalog-query.ts, product-repository.ts
-- search()) from a sequential scan to an index scan as the catalog grows
-- toward 100,000+ SKUs — a plain B-tree index can't accelerate `ILIKE '%x%'`,
-- only a trigram index can.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Product_title_trgm_idx" ON "Product" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_sku_trgm_idx" ON "Product" USING GIN (sku gin_trgm_ops);
