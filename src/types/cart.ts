/** One line in the client's project cart — enough to render, edit qty, and submit as a real quote line item. */
export interface CartItem {
  productId: string;
  slug: string;
  sku: string;
  title: string;
  unit: string;
  /** Catalog price in тенге at the moment it was added; null = "по запросу". */
  priceTenge: number | null;
  qty: number;
  /** Free-text flag carried through to the quote/order line, e.g. "possible" spec-import match needing technical verification before a price is quoted. */
  note?: string | null;
}
