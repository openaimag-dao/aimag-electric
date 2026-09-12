import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

import { siteConfig } from "@/config/site";
import { productRepository, categoryRepository } from "@/server/repositories";
import { articles } from "@/config/articles";
import { mergedCategorySlugs } from "@/config/category-merges";
import { CACHE_TAGS } from "@/lib/cache-tags";

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

/** SEO landing pages targeting specific product-family keywords — same priority tier as category pages. */
const SEO_LANDING_PAGES = ["/kabeli-vvg-avvg", "/kabeli-sip"];

/**
 * Sitemap crawler traffic must not trigger two full catalog queries per request.
 * The cached data is invalidated immediately by existing product/category admin
 * writes via their cache tags, while the TTL provides a safe fallback.
 */
const loadCatalogRoutes = unstable_cache(
  async (): Promise<MetadataRoute.Sitemap> => {
    try {
      const [products, categories] = await Promise.all([
        productRepository.allSlugs(),
        categoryRepository.findMany(),
      ]);

      return [
        ...categories
          .filter((category) => !(category.slug in mergedCategorySlugs))
          .map((category) => ({
            url: `${siteConfig.url}/catalog?cat=${category.slug}`,
            lastModified: category.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.6,
          })),
        ...products.map((product) => ({
          url: `${siteConfig.url}/catalog/${product.slug}`,
          lastModified: product.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ];
    } catch {
      // A temporarily unavailable database must not take robots' sitemap offline.
      return [];
    }
  },
  ["sitemap-catalog-routes-v1"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.categories], revalidate: 3600 }
);

/**
 * Dynamic sitemap: static marketing pages + blog posts + every published
 * product and category. Dynamic rendering lets deployments build without a
 * database; catalog URLs themselves are cached in loadCatalogRoutes.
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
    ...SEO_LANDING_PAGES.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
  ];

  const blogRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${base}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...blogRoutes, ...(await loadCatalogRoutes())];
}
