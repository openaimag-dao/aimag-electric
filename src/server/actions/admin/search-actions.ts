"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/security/rbac";
import { ok, toActionError, type ActionResult } from "@/server/actions/action-result";

export type GlobalSearchResultType = "product" | "category" | "brand" | "customer" | "quote";

export interface GlobalSearchResult {
  type: GlobalSearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const RESULT_LIMIT = 5;

/** Cross-entity search for the admin header search box. */
export async function globalAdminSearch(
  query: string
): Promise<ActionResult<GlobalSearchResult[]>> {
  await requireStaff();
  const q = query.trim();
  if (q.length < 2) return ok([]);

  try {
    const [products, categories, brands, customers, quotes] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, sku: true },
        take: RESULT_LIMIT,
      }),
      prisma.category.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        select: { id: true, title: true, slug: true },
        take: RESULT_LIMIT,
      }),
      prisma.brand.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, slug: true },
        take: RESULT_LIMIT,
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { company: { contains: q, mode: "insensitive" } },
            { contact: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, company: true, contact: true },
        take: RESULT_LIMIT,
      }),
      prisma.quote.findMany({
        where: {
          OR: [
            { company: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, company: true, name: true },
        take: RESULT_LIMIT,
      }),
    ]);

    const results: GlobalSearchResult[] = [
      ...products.map((p) => ({
        type: "product" as const,
        id: p.id,
        title: p.title,
        subtitle: p.sku,
        href: `/admin/products?q=${encodeURIComponent(p.sku)}`,
      })),
      ...categories.map((c) => ({
        type: "category" as const,
        id: c.id,
        title: c.title,
        subtitle: c.slug,
        href: `/admin/categories`,
      })),
      ...brands.map((b) => ({
        type: "brand" as const,
        id: b.id,
        title: b.name,
        subtitle: b.slug,
        href: `/admin/brands`,
      })),
      ...customers.map((c) => ({
        type: "customer" as const,
        id: c.id,
        title: c.company,
        subtitle: c.contact ?? undefined,
        href: `/admin/crm/customers/${c.id}`,
      })),
      ...quotes.map((q2) => ({
        type: "quote" as const,
        id: q2.id,
        title: q2.company,
        subtitle: q2.name,
        href: `/admin/quotes`,
      })),
    ];

    return ok(results);
  } catch (e) {
    return toActionError(e);
  }
}
