import { describe, expect, it } from "vitest";
import { catalogSeo } from "@/lib/catalog-seo";
import { searchParamsToFilters } from "@/lib/catalog-url";

describe("catalog crawl policy", () => {
  it("keeps each category page's own canonical instead of collapsing page two", () => {
    const result = catalogSeo(searchParamsToFilters({ cat: "kabel-provod", page: "2" }), true);
    expect(result.canonical).toBe("/catalog?cat=kabel-provod&page=2");
    expect(result.robots.index).toBe(true);
  });

  it("removes tracking parameters and the explicit first page", () => {
    expect(
      catalogSeo(searchParamsToFilters({ page: "1", utm_source: "google" }), false).canonical
    ).toBe("/catalog");
  });

  it.each([
    { q: "ВВГ" },
    { sort: "price_asc" },
    { stock: "1" },
    { cat: "kabel-provod,avtomaty" },
    { brand: "ABB" },
    { pmin: "500" },
    { "attr:color": "чёрный" },
  ])("excludes search/filter pages for both generic crawlers and Google: %j", (params) => {
    const result = catalogSeo(searchParamsToFilters(params), true);
    expect(result.robots).toMatchObject({
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    });
  });

  it("does not index nonexistent categories", () => {
    expect(catalogSeo(searchParamsToFilters({ cat: "missing" }), false).indexable).toBe(false);
  });

  it.each(["1.5", "Infinity", "-1", "9007199254740992"])("normalizes invalid page %s", (page) => {
    expect(searchParamsToFilters({ page }).page).toBe(1);
  });
});
