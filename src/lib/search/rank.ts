export interface RankableProduct {
  sku: string;
  title: string;
  popularity: number;
}

/**
 * Re-ranks substring-matched search candidates so an exact or prefix SKU
 * match always outranks a merely-popular title/brand/category match — a
 * customer typing an article number expects that exact part first, not
 * whatever else happens to be popular. Ties within a tier fall back to the
 * existing popularity ordering.
 */
export function rankSearchResults<T extends RankableProduct>(products: T[], query: string): T[] {
  const q = query.trim().toLowerCase();

  function tier(p: T): number {
    const sku = p.sku.toLowerCase();
    const title = p.title.toLowerCase();
    if (sku === q) return 0;
    if (sku.startsWith(q)) return 1;
    if (title.startsWith(q)) return 2;
    return 3;
  }

  return [...products].sort((a, b) => {
    const diff = tier(a) - tier(b);
    return diff !== 0 ? diff : b.popularity - a.popularity;
  });
}
