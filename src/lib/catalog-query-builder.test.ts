import { describe, it, expect } from "vitest";
import { buildConditions, orderBySql } from "./catalog-query-builder";
import { emptyFilters } from "./catalog";
import type { CatalogFilters } from "@/types/catalog";

function filters(overrides: Partial<CatalogFilters>): CatalogFilters {
  return { ...emptyFilters, ...overrides };
}

describe("buildConditions", () => {
  it("is just the published check with no active filters", () => {
    const conds = buildConditions(emptyFilters);
    expect(conds).toHaveLength(1);
    expect(conds[0].sql).toContain("p.published = true");
  });

  it("adds a parameterized category condition", () => {
    const conds = buildConditions(filters({ categories: ["kabeli", "provoda"] }));
    expect(conds).toHaveLength(2);
    expect(conds[1].sql).toContain("c.slug IN");
    expect(conds[1].values).toEqual(["kabeli", "provoda"]);
  });

  it("omits a dimension's own condition when excluded — the faceting rule", () => {
    const f = filters({ categories: ["kabeli"], manufacturers: ["IEK"] });
    const withBoth = buildConditions(f);
    const withoutCategories = buildConditions(f, "categories");
    expect(withBoth).toHaveLength(3); // published + categories + manufacturers
    expect(withoutCategories).toHaveLength(2); // published + manufacturers only
    expect(withoutCategories.some((c) => c.sql.includes("c.slug IN"))).toBe(false);
    expect(withoutCategories.some((c) => c.sql.includes("b.name IN"))).toBe(true);
  });

  it("routes material/cores/crossSection/voltage through the same Attribute-row EXISTS check", () => {
    const conds = buildConditions(filters({ materials: ["Медь"] }));
    expect(conds[1].sql).toContain("AttributeValue");
    expect(conds[1].sql).toContain("a.key = ");
    expect(conds[1].values).toContain("material");
    expect(conds[1].values).toContain("Медь");
  });

  it("skips a specific dynamic attribute by its attr: prefix", () => {
    const f = filters({ attrs: { color: ["black"], length: ["10"] } });
    const withoutColor = buildConditions(f, "attr:color");
    const sqls = withoutColor.map((c) => c.values).flat();
    expect(sqls).toContain("length");
    expect(sqls).not.toContain("color");
  });

  it("in-stock filter uses a positive-quantity EXISTS check", () => {
    const conds = buildConditions(filters({ inStockOnly: true }));
    expect(conds[1].sql).toContain("Stock");
    expect(conds[1].sql).toContain("quantity > 0");
  });

  it("price bounds always let a null (по запросу) price through", () => {
    const conds = buildConditions(filters({ priceMin: 100, priceMax: 500 }));
    const priceCond = conds[1];
    expect(priceCond.sql).toContain("IS NULL OR");
    // тенге → тиын conversion (×100), see lib/money.ts.
    expect(priceCond.values).toContain(10000);
    expect(priceCond.values).toContain(50000);
  });

  it("search matches title/sku (with separator variants) or brand/category name", () => {
    const conds = buildConditions(filters({ q: "кабель" }));
    const searchCond = conds[1];
    expect(searchCond.sql).toContain("p.title ILIKE");
    expect(searchCond.sql).toContain("p.sku ILIKE");
    expect(searchCond.sql).toContain("b.name ILIKE");
    expect(searchCond.sql).toContain("c.title ILIKE");
  });

  it("expands cross-section separator variants in the search condition", () => {
    const conds = buildConditions(filters({ q: "4x2.5" }));
    const searchCond = conds[1];
    // expandSeparatorVariants should produce more than one ILIKE pair for title alone.
    const titleLikes = searchCond.values.filter((v) => typeof v === "string" && v.includes("2.5"));
    expect(titleLikes.length).toBeGreaterThan(1);
  });
});

describe("orderBySql", () => {
  it("always sinks products with no real photo to the end, before the chosen sort", () => {
    const sql = orderBySql("popular").sql;
    expect(sql.indexOf("CASE WHEN")).toBeLessThan(sql.indexOf("popularity"));
  });

  it("sorts price ascending/descending with nulls always last", () => {
    expect(orderBySql("price_asc").sql).toContain("ASC NULLS LAST");
    expect(orderBySql("price_desc").sql).toContain("DESC NULLS LAST");
  });

  it("breaks remaining ties by id for stable pagination", () => {
    expect(orderBySql("popular").sql.trim().endsWith("p.id")).toBe(true);
  });
});
