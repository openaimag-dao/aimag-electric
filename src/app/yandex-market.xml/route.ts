import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { siteConfig } from "@/config/site";
import { productRepository, categoryRepository } from "@/server/repositories";
import { toCatalogDTO } from "@/server/mappers/product";
import { productImageUrls } from "@/lib/product-jsonld";
import { mergedCategorySlugs } from "@/config/category-merges";
import { escapeXml } from "@/lib/xml";
import { CACHE_TAGS } from "@/lib/cache-tags";

export const dynamic = "force-dynamic";

interface FeedCategory {
  id: number;
  slug: string;
  title: string;
}

interface FeedOffer {
  id: string;
  url: string;
  price: number;
  categoryId: number;
  picture: string | null;
  name: string;
  vendor: string;
  available: boolean;
}

/**
 * Catalog read is identical to the sitemap's — cached the same way so
 * Yandex Market's periodic re-fetch doesn't add a second full-catalog query
 * pattern alongside the sitemap's.
 */
const loadFeedData = unstable_cache(
  async (): Promise<{ categories: FeedCategory[]; offers: FeedOffer[] }> => {
    const [products, allCategories] = await Promise.all([
      productRepository.findMany(),
      categoryRepository.findMany(),
    ]);

    const categories = allCategories
      .filter((category) => !(category.slug in mergedCategorySlugs))
      .map((category, index) => ({ id: index + 1, slug: category.slug, title: category.title }));
    const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    // Yandex Market requires a real price on every offer — items with no
    // public price (request-only / volume-priced items) aren't eligible for
    // the feed, same rule the product page itself uses to hide the price.
    const offers: FeedOffer[] = products
      .map(toCatalogDTO)
      .filter((p) => p.price !== null && categoryIdBySlug.has(p.categorySlug))
      .map((p) => ({
        id: p.sku,
        url: `${siteConfig.url}/catalog/${p.slug}`,
        price: p.price as number,
        categoryId: categoryIdBySlug.get(p.categorySlug) as number,
        picture: productImageUrls(p.image ? [p.image] : [])[0] ?? null,
        name: p.title,
        vendor: p.manufacturer,
        available: p.availability !== "out",
      }));

    return { categories, offers };
  },
  ["yandex-market-feed-v1"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.categories], revalidate: 3600 }
);

function formatFeedDate(date: Date): string {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

/** YML (Yandex Market Language) product feed — https://yandex.ru/support/partnermarket/export/yml.html */
export async function GET() {
  const { categories, offers } = await loadFeedData();

  const categoriesXml = categories
    .map((c) => `    <category id="${c.id}">${escapeXml(c.title)}</category>`)
    .join("\n");

  const offersXml = offers
    .map(
      (o) => `    <offer id="${escapeXml(o.id)}" available="${o.available}">
      <url>${escapeXml(o.url)}</url>
      <price>${o.price}</price>
      <currencyId>KZT</currencyId>
      <categoryId>${o.categoryId}</categoryId>
      ${o.picture ? `<picture>${escapeXml(o.picture)}</picture>\n      ` : ""}<name>${escapeXml(o.name)}</name>
      <vendor>${escapeXml(o.vendor)}</vendor>
    </offer>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${formatFeedDate(new Date())}">
  <shop>
    <name>${escapeXml(siteConfig.name)}</name>
    <company>${escapeXml(siteConfig.requisites?.legalName ?? siteConfig.name)}</company>
    <url>${escapeXml(siteConfig.url)}</url>
    <currencies>
      <currency id="KZT" rate="1"/>
    </currencies>
    <categories>
${categoriesXml}
    </categories>
    <offers>
${offersXml}
    </offers>
  </shop>
</yml_catalog>
`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
