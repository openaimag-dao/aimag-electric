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
}
