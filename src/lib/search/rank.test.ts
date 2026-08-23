import { describe, it, expect } from "vitest";
import { rankSearchResults, type RankableProduct } from "./rank";

function product(sku: string, title: string, popularity: number): RankableProduct {
  return { sku, title, popularity };
}

describe("rankSearchResults", () => {
  it("ranks an exact SKU match above a more popular substring match", () => {
    const results = rankSearchResults(
      [
        product("SIP-4x120", "СИП-4 4x120 (популярный аналог)", 900),
        product("VVG-4x120", "ВВГ-4x120", 5),
      ],
      "VVG-4x120"
    );
    expect(results[0].sku).toBe("VVG-4x120");
  });

  it("is case-insensitive for the exact match tier", () => {
    const results = rankSearchResults(
      [product("other", "Изолятор", 900), product("vvg-4x120", "ВВГ-4x120", 5)],
      "VVG-4X120"
    );
    expect(results[0].sku).toBe("vvg-4x120");
  });

  it("ranks a SKU prefix match above a title-only match", () => {
    const results = rankSearchResults(
      [product("CAT-99", "ВВГ кабель силовой", 900), product("VVG-4x120-01", "Кабель силовой", 5)],
      "VVG-4x120"
    );
    expect(results[0].sku).toBe("VVG-4x120-01");
  });

  it("falls back to popularity within the same relevance tier", () => {
    const results = rankSearchResults(
      [product("A-1", "Кабель ВВГ вспомогательный", 5), product("A-2", "ВВГ кабель основной", 50)],
      "ВВГ"
    );
    expect(results[0].sku).toBe("A-2");
  });

  it("does not mutate the input array", () => {
    const input = [product("B", "Б", 1), product("A", "А", 2)];
    const copy = [...input];
    rankSearchResults(input, "x");
    expect(input).toEqual(copy);
  });
});
