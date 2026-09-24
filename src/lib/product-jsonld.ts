import { siteConfig } from "@/config/site";
import type { ProductDetailDTO } from "@/server/dto";

/** Only real, fetchable product images — shared by JSON-LD and social previews. */
export function productImageUrls(images: string[]): string[] {
  return images.flatMap((image) => {
    if (!image.trim()) return [];
    try {
      const url = new URL(image, `${siteConfig.url}/`);
      return url.protocol === "https:" || url.protocol === "http:" ? [url.href] : [];
    } catch {
      return [];
    }
  });
}

/**
 * Builds Product + BreadcrumbList JSON-LD for a product page. Pure function,
 * kept out of the page component for readability and reuse.
 */
export function buildProductJsonLd(product: ProductDetailDTO, avgRating: number | null) {
  const url = `${siteConfig.url}/catalog/${product.slug}`;
  const images = productImageUrls(product.images);
  const hasPrice = product.price !== null && Number.isFinite(product.price) && product.price >= 0;
  const brand = product.manufacturer.trim();
  const availability =
    product.availability === "in_stock"
      ? "https://schema.org/InStock"
      : product.availability === "on_order"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/OutOfStock";

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    url,
    name: product.title,
    sku: product.sku,
    category: product.category,
    ...(brand && brand.toLocaleLowerCase() !== "без бренда"
      ? { brand: { "@type": "Brand", name: brand } }
      : {}),
    description: product.description.join(" ") || undefined,
    ...(images.length ? { image: images } : {}),
    // A request-only item has no public price; emitting an incomplete Offer
    // makes the markup invalid and must never be replaced with a zero price.
    ...(hasPrice
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "KZT",
            price: product.price,
            availability,
            seller: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          },
        }
      : {}),
    ...(avgRating !== null && Number.isFinite(avgRating) && product.reviews.length > 0
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
        item: url,
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
