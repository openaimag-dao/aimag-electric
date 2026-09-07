import { describe, it, expect } from "vitest";
import { parseSkuLines } from "./quick-order-parse";

describe("parseSkuLines", () => {
  it("parses SKU + quantity separated by whitespace", () => {
    expect(parseSkuLines("KAB-1001 10")).toEqual([
      { sku: "KAB-1001", qty: 10, raw: "KAB-1001 10" },
    ]);
  });

  it("parses SKU + quantity separated by a tab or comma", () => {
    expect(parseSkuLines("KAB-1001\t10")).toEqual([
      { sku: "KAB-1001", qty: 10, raw: "KAB-1001\t10" },
    ]);
    expect(parseSkuLines("KAB-1001, 10")).toEqual([
      { sku: "KAB-1001", qty: 10, raw: "KAB-1001, 10" },
    ]);
  });

  it("defaults quantity to 1 when only a SKU is given", () => {
    expect(parseSkuLines("KAB-1001")).toEqual([{ sku: "KAB-1001", qty: 1, raw: "KAB-1001" }]);
  });

  it("accepts a decimal quantity", () => {
    expect(parseSkuLines("KAB-1001 2.5")).toEqual([
      { sku: "KAB-1001", qty: 2.5, raw: "KAB-1001 2.5" },
    ]);
    expect(parseSkuLines("KAB-1001 2,5")).toEqual([
      { sku: "KAB-1001", qty: 2.5, raw: "KAB-1001 2,5" },
    ]);
  });

  it("parses multiple lines and skips blank ones", () => {
    const result = parseSkuLines("KAB-1001 10\n\nAVT-1039 5\n");
    expect(result).toEqual([
      { sku: "KAB-1001", qty: 10, raw: "KAB-1001 10" },
      { sku: "AVT-1039", qty: 5, raw: "AVT-1039 5" },
    ]);
  });

  it("falls back to qty 1 for a non-positive or non-numeric trailing token", () => {
    expect(parseSkuLines("KAB-1001 0")[0].qty).toBe(1);
    expect(parseSkuLines("KAB-1001 abc")).toEqual([
      { sku: "KAB-1001 abc", qty: 1, raw: "KAB-1001 abc" },
    ]);
  });

  it("caps at 200 lines", () => {
    const text = Array.from({ length: 250 }, (_, i) => `SKU-${i} 1`).join("\n");
    expect(parseSkuLines(text)).toHaveLength(200);
  });
});
