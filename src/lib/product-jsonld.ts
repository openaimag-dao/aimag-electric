import { siteConfig } from "@/config/site";
import { isPlaceholderBrand } from "@/lib/brand";
import type { ProductDetailDTO } from "@/server/dto";

/** Spec rows already shown elsewhere in the Product object — don't duplicate them in additionalProperty. */
const ADDITIONAL_PROPERTY_EXCLUDE = new Set([
  "Производитель",
  "Артикул",
  "Категория",
  "Единица измерения",
  "Гарантия",
]);

/**
 * Builds Product + BreadcrumbList JSON-LD for a product page. Pure function,
 * kept out of the page component for readability and reuse.
 */
export function buildProductJsonLd(product: ProductDetailDTO, avgRating: number | null) {
  const availability =
    product.availability === "in_stock"
      ? "https://schema.org/InStock"
      : product.availability === "on_order"
        ? // "On order" here means restockable-but-currently-out, not a
          // not-yet-released item — BackOrder is the correct schema.org
          // state, not PreOrder.
          "https://schema.org/BackOrder"
        : "https://schema.org/OutOfStock";

  const url = `${siteConfig.url}/catalog/${product.slug}`;
  const additionalProperty = product.specGroups
    .flatMap((g) => g.rows)
    .filter((r) => !ADDITIONAL_PROPERTY_EXCLUDE.has(r.label))
    .map((r) => ({ "@type": "PropertyValue", name: r.label, value: r.value }));

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url,
    sku: product.sku,
    mpn: product.sku,
    category: product.category,
    ...(isPlaceholderBrand(product.manufacturer)
      ? {}
      : { brand: { "@type": "Brand", name: product.manufacturer } }),
    description: product.description[0],
    ...(product.images.length ? { image: product.images } : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "KZT",
      ...(product.price !== null ? { price: product.price } : {}),
      availability,
      seller: { "@type": "Organization", name: siteConfig.name },
    },
    ...(avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: product.reviews.length,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Каталог", item: `${siteConfig.url}/catalog` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category,
        item: `${siteConfig.url}/catalog?cat=${product.categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.title,
        item: `${siteConfig.url}/catalog/${product.slug}`,
      },
    ],
  };

  return { productLd, breadcrumbLd };
}

/** Average review rating rounded to 1 decimal, or null if no reviews. */
export function averageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
