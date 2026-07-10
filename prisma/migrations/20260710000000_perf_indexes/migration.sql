-- Performance & integrity: composite indexes for catalog at scale (~100k),
-- and a unique (productId, kind) on Price enabling atomic upserts.

-- Product composite indexes for published catalog filtering + ordering.
CREATE INDEX "Product_published_categoryId_popularity_idx" ON "Product"("published", "categoryId", "popularity");
CREATE INDEX "Product_published_brandId_popularity_idx" ON "Product"("published", "brandId", "popularity");
CREATE INDEX "Product_published_popularity_idx" ON "Product"("published", "popularity");
CREATE INDEX "Product_published_createdAt_idx" ON "Product"("published", "createdAt");

-- Price: drop the non-unique (productId, kind) index, replace with a UNIQUE.
DROP INDEX IF EXISTS "Price_productId_kind_idx";
CREATE UNIQUE INDEX "Price_productId_kind_key" ON "Price"("productId", "kind");
