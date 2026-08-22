import "server-only";

import type { Prisma, OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { tableSelfHeal } from "@/lib/db-self-heal";

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
]);

/** e.g. "ORD-260822-A1B2" — human-readable, no counter/sequence needed (short random suffix avoids collisions). */
function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `ORD-${date}-${suffix}`;
}

export const orderAdminRepository = {
  list() {
    return withTables(() =>
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: { items: true, _count: { select: { items: true, documents: true } } },
      })
    );
  },

  /** Quote ids that already have an order — used to gate "Создать заказ" without a cross-table Prisma include (that would mix this table's self-heal with quote-self-heal.ts's, unsafely). */
  quoteIdsWithOrders() {
    return withTables(async () => {
      const rows = await prisma.order.findMany({
        where: { quoteId: { not: null } },
        select: { quoteId: true },
      });
      return new Set(rows.map((r) => r.quoteId as string));
    });
  },

  byId(id: string) {
    return withTables(() =>
      prisma.order.findUnique({
        where: { id },
        include: {
          items: { orderBy: { position: "asc" } },
          documents: { orderBy: { position: "asc" } },
          quote: { select: { id: true, title: true, company: true } },
          customer: { select: { id: true, company: true } },
          user: { select: { id: true, name: true, email: true } },
          // Deliberately no `company` include here: Order.companyId is never
          // actually set by any current flow, and joining it would pull in
          // the Company self-heal domain unnecessarily (see order-repository.ts's
          // companyId is fine as a plain scalar field, just not resolved to a name yet).
        },
      })
    );
  },

  /** Phase 16: Quote → Order, only from an approved (WON) quote with no order yet. */
  async createFromQuote(quoteId: string) {
    return withTables(async () => {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true, order: true },
      });
      if (!quote) throw new Error("QUOTE_NOT_FOUND");
      if (quote.status !== "WON") throw new Error("QUOTE_NOT_APPROVED");
      if (quote.order) throw new Error("ORDER_ALREADY_EXISTS");

      const totalTiyn = quote.items.reduce((sum, i) => sum + (i.amountTiyn ?? 0) * i.qty, 0);

      return prisma.order.create({
        data: {
          number: generateOrderNumber(),
          quote: { connect: { id: quote.id } },
          ...(quote.customerId ? { customer: { connect: { id: quote.customerId } } } : {}),
          ...(quote.userId ? { user: { connect: { id: quote.userId } } } : {}),
          totalTiyn: totalTiyn || null,
          items: {
            create: quote.items.map((i, index) => ({
              productId: i.productId,
              sku: i.sku,
              title: i.title,
              qty: i.qty,
              unit: i.unit,
              amountTiyn: i.amountTiyn,
              position: index,
            })),
          },
        },
        include: { items: true },
      });
    });
  },

  updateStatus(id: string, status: OrderStatus) {
    return withTables(() => prisma.order.update({ where: { id }, data: { status } }));
  },

  updateDelivery(
    id: string,
    data: {
      carrier: string | null;
      trackingNumber: string | null;
      estimatedDelivery: Date | null;
      actualDelivery: Date | null;
    }
  ) {
    return withTables(() => prisma.order.update({ where: { id }, data }));
  },

  update(id: string, data: Prisma.OrderUpdateInput) {
    return withTables(() => prisma.order.update({ where: { id }, data }));
  },

  remove(id: string) {
    return withTables(() => prisma.order.delete({ where: { id } }));
  },

  addDocument(orderId: string, data: Omit<Prisma.OrderDocumentCreateInput, "order">) {
    return withTables(() =>
      prisma.orderDocument.create({ data: { ...data, order: { connect: { id: orderId } } } })
    );
  },

  removeDocument(id: string) {
    return withTables(() => prisma.orderDocument.delete({ where: { id } }));
  },
};
