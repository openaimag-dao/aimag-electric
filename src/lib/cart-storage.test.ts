import { describe, expect, it } from "vitest";
import { parseStoredCart } from "./cart-storage";

const item = {
  productId: "p1",
  slug: "test",
  sku: "T1",
  title: "Кабель",
  unit: "м",
  priceTenge: null,
  qty: 37,
};

describe("stored cart recovery", () => {
  it.each([null, "", "{bad", "null", "{}"])("recovers safely from invalid storage %s", (raw) => {
    expect(parseStoredCart(raw)).toEqual([]);
  });
  it("keeps valid unpriced and zero-priced products", () => {
    expect(
      parseStoredCart(JSON.stringify([item, { ...item, productId: "p2", priceTenge: 0 }]))
    ).toHaveLength(2);
  });
  it("drops invalid entries without losing usable lines", () => {
    const result = parseStoredCart(
      JSON.stringify([
        null,
        { ...item, qty: "37" },
        { ...item, qty: -1 },
        { ...item, priceTenge: -1 },
        { ...item, title: null },
        item,
      ])
    );
    expect(result).toEqual([item]);
  });
  it("avoids duplicate product keys after recovery", () => {
    expect(parseStoredCart(JSON.stringify([item, item]))).toEqual([item]);
  });
  it("keeps fractional quantities and notes", () => {
    const line = { ...item, qty: 1.5, note: "Проверить аналог" };
    expect(parseStoredCart(JSON.stringify([line]))).toEqual([line]);
  });
});
