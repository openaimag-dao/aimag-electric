import { describe, expect, it } from "vitest";
import { publicPriceTiyn, type PublicPriceRow } from "./public-price";
import { priceFormSchema } from "./validations/admin";

const now = Date.UTC(2026, 8, 27);
const row = (overrides: Partial<PublicPriceRow> = {}): PublicPriceRow => ({
  kind: "BASE",
  amount: 123400,
  minQty: 1,
  validFrom: new Date(0),
  validTo: null,
  ...overrides,
});

describe("public unit price", () => {
  it("does not advertise a wholesale quantity discount for a single unit", () => {
    expect(
      publicPriceTiyn([row(), row({ kind: "WHOLESALE", amount: 10000, minQty: 100 })], now)
    ).toBe(123400);
  });
  it("returns price on request when only quantity-restricted offers exist", () => {
    expect(publicPriceTiyn([row({ minQty: 100 })], now)).toBeNull();
  });
  it("uses an eligible promotion but ignores a quantity-restricted promotion", () => {
    expect(publicPriceTiyn([row(), row({ kind: "PROMO", amount: 50000 })], now)).toBe(50000);
    expect(publicPriceTiyn([row(), row({ kind: "PROMO", amount: 50000, minQty: 10 })], now)).toBe(
      123400
    );
  });
  it("ignores future, expired and unpriced offers", () => {
    expect(
      publicPriceTiyn(
        [
          row({ validFrom: new Date(now + 1) }),
          row({ validTo: new Date(now - 1) }),
          row({ amount: null }),
        ],
        now
      )
    ).toBeNull();
  });
  it("honors validity boundaries and zero as an explicit price", () => {
    expect(
      publicPriceTiyn([row({ amount: 0, validFrom: new Date(now), validTo: new Date(now) })], now)
    ).toBe(0);
  });
});

describe("admin price input", () => {
  it("preserves empty input as price on request rather than coercing to zero", () => {
    expect(priceFormSchema.parse({ productId: "test", amountTenge: "" }).amountTenge).toBe("");
  });
  it.each([
    ["0", 0],
    ["1234.50", 1234.5],
  ])("accepts explicit numeric price %s", (input, expected) => {
    expect(priceFormSchema.parse({ productId: "test", amountTenge: input }).amountTenge).toBe(
      expected
    );
  });
  it.each(["-1", "Infinity", "abc"])("rejects invalid price %s", (amountTenge) => {
    expect(priceFormSchema.safeParse({ productId: "test", amountTenge }).success).toBe(false);
  });
});
