-- Documentation only — this DB has no _prisma_migrations history (schema
-- ships via `db push` / manual DDL). The actual production schema change is
-- applied by the self-heal in src/server/repositories/admin/company-price-admin-repository.ts.

CREATE TABLE "CompanyPrice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amountTiyn" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyPrice_companyId_productId_key" ON "CompanyPrice"("companyId", "productId");
CREATE INDEX "CompanyPrice_companyId_idx" ON "CompanyPrice"("companyId");
CREATE INDEX "CompanyPrice_productId_idx" ON "CompanyPrice"("productId");

ALTER TABLE "CompanyPrice" ADD CONSTRAINT "CompanyPrice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyPrice" ADD CONSTRAINT "CompanyPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
