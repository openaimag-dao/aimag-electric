import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { productRepository, categoryRepository } from "@/server/repositories";
import { articles } from "@/config/articles";

export const dynamic = "force-dynamic";

/** Static marketing/legal pages with no dynamic data — every one of these is a real route under src/app. */
const STATIC_PAGES = [
  "/dostavka",
  "/faq",
  "/garantiya",
  "/kontakty",
  "/o-kompanii",
  "/oplata",
  "/privacy",
  "/terms",
  "/vozvrat",
  "/blog",
];

/**
 * Dynamic sitemap: static marketing pages + blog posts + every published
 * product and category, sourced from the DB. Regenerated per request
 * (force-dynamic) so new catalog entries appear without a rebuild.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...STATIC_PAGES.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];

  const blogRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const [products, categories] = await Promise.all([
      productRepository.allSlugs(),
      categoryRepository.findMany(),
    ]);

    productRoutes = products.map((p) => ({
      url: `${base}/catalog/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    categoryRoutes = categories.map((c) => ({
      url: `${base}/catalog?cat=${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // If the DB is unreachable at build/generation time, still return static routes.
  }

  return [...staticRoutes, ...blogRoutes, ...categoryRoutes, ...productRoutes];
}
