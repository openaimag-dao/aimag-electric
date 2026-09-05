import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { productRepository, categoryRepository } from "@/server/repositories";

export const dynamic = "force-dynamic";

/** Marketing/help pages with no DB-backed `updatedAt` — reasonable static defaults. */
const STATIC_CONTENT_PAGES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/o-kompanii", changeFrequency: "monthly", priority: 0.5 },
  { path: "/dostavka", changeFrequency: "monthly", priority: 0.5 },
  { path: "/oplata", changeFrequency: "monthly", priority: 0.5 },
  { path: "/garantiya", changeFrequency: "monthly", priority: 0.5 },
  { path: "/vozvrat", changeFrequency: "monthly", priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/kontakty", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * Dynamic sitemap: static marketing pages + every published product and
 * category, sourced from the DB. Regenerated per request (force-dynamic) so new
 * catalog entries appear without a rebuild. `lastModified` uses each row's
 * real `updatedAt` where available; static content pages (no DB row backing
 * them) fall back to the current date.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...STATIC_CONTENT_PAGES.map((p) => ({
      url: `${base}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const [products, categories] = await Promise.all([
      productRepository.allSlugs(),
      categoryRepository.findMany(),
    ]);

    productRoutes = products.map((p) => ({
      url: `${base}/catalog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    categoryRoutes = categories.map((c) => ({
      url: `${base}/catalog?cat=${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // If the DB is unreachable at build/generation time, still return static routes.
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
