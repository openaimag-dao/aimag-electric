import { describe, it, expect } from "vitest";
import { queryCatalog, emptyFilters } from "./catalog";
import type { CatalogProduct } from "@/types/catalog";

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: overrides.id ?? "1",
    slug: overrides.slug ?? "slug",
    title: overrides.title ?? "Товар",
    categorySlug: "kabeli",
    category: "Кабели",
    manufacturer: "AIMAG",
    sku: "SKU-1",
    price: 100,
    unit: "м",
    availability: "in_stock",
    material: null,
    cores: null,
    crossSection: null,
    voltage: null,
    createdAt: "2026-01-01",
    popularity: 0,
    image: null,
    ...overrides,
  };
}

describe("queryCatalog image-sink sort", () => {
  it("sinks products with no real photo to the end regardless of sort key", () => {
    const products = [
      product({ id: "a", popularity: 100, image: null }),
      product({ id: "b", popularity: 50, image: "https://example.com/b.jpg" }),
      product({ id: "c", popularity: 10, image: "https://example.com/c.jpg" }),
    ];
    const result = queryCatalog(products, { ...emptyFilters, sort: "popular" });
    expect(result.items.map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  it("still applies the chosen sort within each photo/no-photo group", () => {
    const products = [
      product({ id: "a", title: "Я товар", image: "https://example.com/a.jpg" }),
      product({ id: "b", title: "А товар", image: "https://example.com/b.jpg" }),
      product({ id: "c", title: "Б товар", image: null }),
      product({ id: "d", title: "В товар", image: null }),
    ];
    const result = queryCatalog(products, { ...emptyFilters, sort: "title" });
    expect(result.items.map((p) => p.id)).toEqual(["b", "a", "c", "d"]);
  });

  it("keeps all-photo and all-no-photo catalogs sorted normally", () => {
    const allWithPhotos = [
      product({ id: "a", price: 300, image: "x" }),
      product({ id: "b", price: 100, image: "x" }),
    ];
    const result = queryCatalog(allWithPhotos, { ...emptyFilters, sort: "price_asc" });
    expect(result.items.map((p) => p.id)).toEqual(["b", "a"]);
  });
});
