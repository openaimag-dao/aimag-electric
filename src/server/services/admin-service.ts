import "server-only";

import { prisma } from "@/lib/prisma";

/** Aggregations for the admin dashboard + reference lists for form selects. */
export const adminService = {
  async dashboard() {
    const [
      products,
      categories,
      brands,
      warehouses,
      users,
      quotesTotal,
      quotesNew,
      documents,
      lowStock,
      recentQuotes,
      topProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.brand.count(),
      prisma.warehouse.count(),
      prisma.user.count(),
      prisma.quote.count(),
      prisma.quote.count({ where: { status: "NEW" } }),
      prisma.productDocument.count(),
      prisma.stock.count({ where: { quantity: { lte: 0 } } }),
      prisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.product.findMany({
        orderBy: { popularity: "desc" },
        take: 5,
        include: { brand: true, category: true },
      }),
    ]);

    const quotesByStatus = await prisma.quote.groupBy({
      by: ["status"],
      _count: true,
    });

    return {
      counters: {
        products,
        categories,
        brands,
        warehouses,
        users,
        quotesTotal,
        quotesNew,
        documents,
        lowStock,
      },
      quotesByStatus: quotesByStatus.map((q) => ({
        status: q.status as string,
        count: (q._count as number) ?? 0,
      })),
      recentQuotes: recentQuotes.map((q) => ({
        id: q.id,
        company: q.company,
        name: q.name,
        status: q.status as string,
        createdAt: q.createdAt.toISOString(),
      })),
      topProducts: topProducts.map((p) => ({
        id: p.id,
        title: p.title,
        brand: p.brand.name,
        category: p.category.title,
        popularity: p.popularity,
      })),
    };
  },

  /**
   * Data-quality & operations insights for the dashboard widgets: products
   * missing images/description/documents, low stock, and the recent audit feed.
   */
  async dashboardInsights() {
    const [
      noImages,
      noDescription,
      noDocuments,
      lowStockList,
      recentAudit,
      recentImports,
    ] = await Promise.all([
      prisma.product.count({ where: { images: { none: {} } } }),
      prisma.product.count({ where: { OR: [{ description: null }, { description: "" }] } }),
      prisma.product.count({ where: { documents: { none: {} } } }),
      prisma.stock.findMany({
        where: { quantity: { lte: 5 } },
        orderBy: { quantity: "asc" },
        take: 8,
        include: {
          product: { select: { title: true, sku: true } },
          warehouse: { select: { code: true } },
        },
      }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.auditLog.findMany({
        where: { action: "IMPORT" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return {
      quality: { noImages, noDescription, noDocuments },
      lowStock: lowStockList.map((s) => ({
        title: s.product.title,
        sku: s.product.sku,
        warehouse: s.warehouse.code,
        quantity: s.quantity,
      })),
      recentAudit: recentAudit.map((a) => ({
        id: a.id,
        action: a.action as string,
        entity: a.entity,
        summary: a.summary,
        actor: a.actorEmail,
        createdAt: a.createdAt.toISOString(),
      })),
      recentImports: recentImports.map((a) => ({
        id: a.id,
        summary: a.summary,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  },

  /** Lightweight reference lists for <Select> inputs in forms. */
  async refs() {
    const [categories, brands, warehouses, products] = await Promise.all([
      prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
      prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.warehouse.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, city: true } }),
      prisma.product.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, sku: true } }),
    ]);
    return { categories, brands, warehouses, products };
  },
};
