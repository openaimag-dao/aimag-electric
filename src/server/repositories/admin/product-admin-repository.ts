import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { qualityWhere, type ProductQualityFilter } from "@/lib/admin/product-quality";

const listInclude = {
  category: true,
  brand: true,
  prices: true,
  stock: true,
  _count: { select: { documents: true, reviews: true } },
} satisfies Prisma.ProductInclude;

export interface ProductListParams {
  page: number;
  pageSize: number;
  q?: string;
  categoryId?: string;
  brandId?: string;
  /** undefined = both published and hidden */
  published?: boolean;
  quality?: ProductQualityFilter;
}

export const productAdminRepository = {
  list() {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: listInclude,
    });
  },
  /** Server-side filtered + paginated listing — the products table doesn't load the whole catalog into the browser. */
  async listPage(params: ProductListParams) {
    const where: Prisma.ProductWhereInput = {
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: "insensitive" } },
              { sku: { contains: params.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.brandId ? { brandId: params.brandId } : {}),
      ...(params.published !== undefined ? { published: params.published } : {}),
      ...(params.quality ? qualityWhere(params.quality) : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: listInclude,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    return { rows, total };
  },
  byId(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        prices: true,
        stock: { include: { warehouse: true } },
        documents: { orderBy: { order: "asc" } },
        values: { include: { attribute: true } },
      },
    });
  },
  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },
  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.product.delete({ where: { id } });
  },
  count() {
    return prisma.product.count();
  },
};

export type ProductAdminRow = Prisma.ProductGetPayload<{ include: typeof listInclude }>;
