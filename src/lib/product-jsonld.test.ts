import { describe, expect, it } from "vitest";
import { buildProductJsonLd, productImageUrls } from "@/lib/product-jsonld";
import { siteConfig } from "@/config/site";
import type { ProductDetailDTO } from "@/server/dto";

const product: ProductDetailDTO = {
  id: "product-1",
  slug: "vvg-3x25",
  title: "ВВГ 3×2,5",
  categorySlug: "kabel-provod",
  category: "Кабель и провод",
  manufacturer: "Завод",
  sku: "VVG-325",
  price: 750,
  unit: "м",
  availability: "in_stock",
  material: "медь",
  cores: 3,
  crossSection: 2.5,
  voltage: 0.66,
  attrs: {},
  createdAt: "2026-01-01",
  popularity: 0,
  description: ["Силовой кабель.", "Три медные жилы."],
  images: ["/products/vvg.jpg"],
  galleryCount: 1,
  specGroups: [],
  documents: [],
  reviews: [],
  leadTime: "",
  warranty: "",
};

describe("product search markup", () => {
  it("publishes the real image, public price, product URL and full description", () => {
    const { productLd } = buildProductJsonLd(product, null);
    expect(productLd.image).toEqual([`${siteConfig.url}/products/vvg.jpg`]);
    expect(productLd.offers).toMatchObject({
      price: 750,
      priceCurrency: "KZT",
      url: `${siteConfig.url}/catalog/vvg-3x25`,
    });
    expect(productLd.description).toBe("Силовой кабель. Три медные жилы.");
    expect(productLd).not.toHaveProperty("aggregateRating");
  });

  it.each([null, NaN, Infinity, -1])("does not invent an Offer for price %s", (price) => {
    expect(buildProductJsonLd({ ...product, price }, null).productLd).not.toHaveProperty("offers");
  });

  it("does not advertise a placeholder brand or image", () => {
    const { productLd } = buildProductJsonLd(
      { ...product, manufacturer: "Без бренда", images: [] },
      null
    );
    expect(productLd).not.toHaveProperty("brand");
    expect(productLd).not.toHaveProperty("image");
  });

  it("uses fetchable image URLs only", () => {
    expect(
      productImageUrls([
        "",
        "javascript:alert(1)",
        "data:image/png;base64,a",
        "https://cdn.example.com/photo.jpg",
      ])
    ).toEqual(["https://cdn.example.com/photo.jpg"]);
  });
});
