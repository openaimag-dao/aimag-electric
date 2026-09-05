/**
 * The DB carries a placeholder "Без бренда" Brand row for products with no
 * known manufacturer (data import gap, not a real brand). Surfacing it as if
 * it were a real brand — in the visible spec table or, worse, in Product
 * JSON-LD's `brand` field — makes both the page and the structured data
 * claim a fact we don't actually have.
 */
const PLACEHOLDER_BRAND_NAMES = new Set(["без бренда"]);

export function isPlaceholderBrand(name: string): boolean {
  return PLACEHOLDER_BRAND_NAMES.has(name.trim().toLowerCase());
}
