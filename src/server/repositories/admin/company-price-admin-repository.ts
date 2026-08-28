import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { tableSelfHeal } from "@/lib/db-self-heal";

const withTable = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "CompanyPrice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amountTiyn" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyPrice_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyPrice_companyId_productId_key" ON "CompanyPrice"("companyId", "productId")`,
  `CREATE INDEX IF NOT EXISTS "CompanyPrice_companyId_idx" ON "CompanyPrice"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "CompanyPrice_productId_idx" ON "CompanyPrice"("productId")`,
  `ALTER TABLE "CompanyPrice" ADD CONSTRAINT "CompanyPrice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "CompanyPrice" ADD CONSTRAINT "CompanyPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
]);

const include = {
  product: { select: { id: true, title: true, sku: true, unit: true } },
} satisfies Prisma.CompanyPriceInclude;

export const companyPriceAdminRepository = {
  listForCompany(companyId: string) {
    return withTable(() =>
      prisma.companyPrice.findMany({
        where: { companyId },
        include,
        orderBy: { createdAt: "desc" },
      })
    );
  },
  create(data: Prisma.CompanyPriceCreateInput) {
    return withTable(() => prisma.companyPrice.create({ data }));
  },
  update(id: string, amountTiyn: number) {
    return withTable(() => prisma.companyPrice.update({ where: { id }, data: { amountTiyn } }));
  },
  remove(id: string) {
    return withTable(() => prisma.companyPrice.delete({ where: { id } }));
  },
  /**
   * Suggested unit prices for a set of companies' products — surfaced (never
   * auto-applied) in the admin quote item price editor. Batched across all
   * quotes on the page rather than queried per-quote.
   */
  forCompaniesAndProducts(companyIds: string[], productIds: string[]) {
    if (companyIds.length === 0 || productIds.length === 0) return Promise.resolve([]);
    return withTable(() =>
      prisma.companyPrice.findMany({
        where: { companyId: { in: companyIds }, productId: { in: productIds } },
        select: { companyId: true, productId: true, amountTiyn: true },
      })
    );
  },
};

export type CompanyPriceAdminRow = Prisma.CompanyPriceGetPayload<{ include: typeof include }>;
