import type { PriceKind } from "@prisma/client";

export interface PublicPriceRow {
  kind: PriceKind;
  amount: number | null;
  minQty: number;
  validFrom: Date;
  validTo: Date | null;
}

/** Unit-price reference for listings, product pages and quotes. Volume offers need a separate quote. */
export function publicPriceTiyn(prices: PublicPriceRow[], now = Date.now()): number | null {
  const row = publicPriceRow(prices, now);
  return row ? row.amount! : null;
}

/** The single row publicPriceTiyn() picks — its validFrom feeds the product's Offer markup. */
export function publicPriceRow(prices: PublicPriceRow[], now = Date.now()): PublicPriceRow | null {
  const eligible = prices.filter(
    (price) =>
      price.amount !== null &&
      price.minQty <= 1 &&
      price.validFrom.getTime() <= now &&
      (price.validTo === null || price.validTo.getTime() >= now)
  );
  const promo = eligible.filter((price) => price.kind === "PROMO");
  const pool = promo.length ? promo : eligible;
  return pool.reduce<PublicPriceRow | null>(
    (best, price) => (best === null || price.amount! < best.amount! ? price : best),
    null
  );
}
