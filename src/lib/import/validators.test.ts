import { describe, it, expect } from "vitest";
import { buildPreview, type ImportContext } from "./validators";

function ctx(partial?: Partial<ImportContext>): ImportContext {
  return {
    categorySlugs: new Set(["kabeli"]),
    categoryTitleToSlug: new Map([["кабели", "kabeli"]]),
    brandSlugs: new Set(["kazenergokabel"]),
    brandNameToSlug: new Map([["казэнергокабель", "kazenergokabel"]]),
    productSkus: new Set(["EXISTING-1"]),
    warehouseCodes: new Set(["SHY"]),
    warehouseNameToCode: new Map([["шымкент", "SHY"]]),
    ...partial,
  };
}

describe("buildPreview · products", () => {
  it("marks a new valid product as create", () => {
    const rows = [{ sku: "VVG-3", title: "Кабель ВВГ 3", category: "kabeli", brand: "kazenergokabel", price: "420", stock: "100" }];
    const pv = buildPreview("products", rows, [], "t.xlsx", ctx());
    expect(pv.rows[0].action).toBe("create");
    expect(pv.counts.errors).toBe(0);
  });

  it("marks an existing SKU as update", () => {
    const rows = [{ sku: "EXISTING-1", title: "Обновление", category: "kabeli", brand: "kazenergokabel" }];
    const pv = buildPreview("products", rows, [], "t.xlsx", ctx());
    expect(pv.rows[0].action).toBe("update");
  });

  it("errors when the category cannot be resolved", () => {
    const rows = [{ sku: "X-1", title: "Товар", category: "unknown-cat", brand: "kazenergokabel" }];
    const pv = buildPreview("products", rows, [], "t.xlsx", ctx());
    expect(pv.rows[0].action).toBe("skip");
    expect(pv.rows[0].issues.some((i) => i.level === "error")).toBe(true);
  });

  it("resolves category by Russian title", () => {
    const rows = [{ sku: "X-2", title: "Товар", category: "Кабели", brand: "Казэнергокабель" }];
    const pv = buildPreview("products", rows, [], "t.xlsx", ctx());
    expect(pv.rows[0].action).toBe("create");
  });

  it("lets later rows reference categories created earlier in the same file", () => {
    const rows = [
      { slug: "novaya", title: "Новая категория" },
    ];
    const pv = buildPreview("categories", rows, [], "t.xlsx", ctx());
    expect(pv.rows[0].action).toBe("create");
  });
});

describe("buildPreview · stock", () => {
  it("errors when the warehouse is unknown", () => {
    const rows = [{ sku: "EXISTING-1", warehouse: "NOPE", quantity: "5" }];
    const pv = buildPreview("stock", rows, [], "t.xlsx", ctx());
    expect(pv.rows[0].issues.some((i) => i.level === "error")).toBe(true);
  });
  it("accepts a known warehouse code and product", () => {
    const rows = [{ sku: "EXISTING-1", warehouse: "SHY", quantity: "5" }];
    const pv = buildPreview("stock", rows, [], "t.xlsx", ctx());
    expect(pv.rows[0].issues.filter((i) => i.level === "error")).toHaveLength(0);
  });
});
