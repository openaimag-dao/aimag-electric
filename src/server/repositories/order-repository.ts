import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { tableSelfHeal } from "@/lib/db-self-heal";

// Same DDL as order-admin-repository.ts — either touch point can be first to
// run in production, so both carry the full self-heal (idempotent either way).
const withTables = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "quoteId" TEXT,
    "projectId" TEXT,
    "customerId" TEXT,
    "companyId" TEXT,
    "userId" TEXT,
    "managerId" TEXT,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "totalTiyn" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_number_key" ON "Order"("number")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_quoteId_key" ON "Order"("quoteId")`,
  `CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status")`,
  `CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId")`,
  `CREATE INDEX IF NOT EXISTS "Order_companyId_idx" ON "Order"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId")`,
  `CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt")`,
  `CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "slug" TEXT,
    "sku" TEXT,
    "title" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'шт',
    "amountTiyn" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId")`,
  `CREATE TABLE IF NOT EXISTS "OrderDocument" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OrderDocument_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "OrderDocument_orderId_idx" ON "OrderDocument"("orderId")`,
  `ALTER TABLE "Order" ADD CONSTRAINT "Order_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Order" ADD CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Order" ADD CONSTRAINT "Order_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  // schema.prisma types Order.status/OrderDocument.kind as real Postgres
  // enums, but the table DDL above (and the shipped migration) only ever
  // created plain TEXT columns — any Prisma query that filters by status
  // (e.g. an admin dashboard count) makes the query engine cast to the
  // enum type name, which 500s with "type ... does not exist" until this
  // runs once. Column-level self-heal, not a table-level one, since the
  // table already exists on every production DB by the time this matters.
  `CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED')`,
  `ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT`,
  `ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING "status"::"OrderStatus"`,
  `ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'NEW'::"OrderStatus"`,
  `CREATE TYPE "OrderDocumentKind" AS ENUM ('INVOICE', 'CONTRACT', 'ACT', 'SPECIFICATION', 'WAYBILL', 'OTHER')`,
  `ALTER TABLE "OrderDocument" ALTER COLUMN "kind" TYPE "OrderDocumentKind" USING "kind"::"OrderDocumentKind"`,
]);

/** A user may see an order if they own it (userId) or it belongs to a company they're a member of — same rule as projects. */
function accessWhere(userId: string, companyIds: string[]): Prisma.OrderWhereInput["OR"] {
  const or: Prisma.OrderWhereInput["OR"] = [{ userId }];
  if (companyIds.length > 0) or.push({ companyId: { in: companyIds } });
  return or;
}

export const orderRepository = {
  listForUser(userId: string, companyIds: string[]) {
    return withTables(() =>
      prisma.order.findMany({
        where: { OR: accessWhere(userId, companyIds) },
        include: { items: { select: { id: true, qty: true, amountTiyn: true } } },
        orderBy: { createdAt: "desc" },
      })
    );
  },

  getForUser(id: string, userId: string, companyIds: string[]) {
    return withTables(() =>
      prisma.order.findFirst({
        where: { id, OR: accessWhere(userId, companyIds) },
        include: {
          items: { orderBy: { position: "asc" } },
          documents: { orderBy: { position: "asc" } },
          company: { select: { name: true } },
        },
      })
    );
  },
};
