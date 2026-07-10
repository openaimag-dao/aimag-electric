import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { productRepository, categoryRepository } from "@/server/repositories";

export const dynamic = "force-dynamic";

/**
 * Dynamic sitemap: static marketing pages + every published product and
 * category, sourced from the DB. Regenerated per request (force-dynamic) so new
 * catalog entries appear without a rebuild.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
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

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
