import type { Availability } from "@/types/catalog";

/** Minimal stock shape needed to derive availability. */
export interface StockLike {
  quantity: number;
  restockAt: Date | null;
}

/**
 * Single source of truth for availability: in stock if any warehouse has a
 * positive quantity; otherwise on order if a restock date exists; else out.
 */
export function deriveAvailabilityFromStock(stock: StockLike[]): Availability {
  const total = stock.reduce((sum, s) => sum + s.quantity, 0);
  if (total > 0) return "in_stock";
  return stock.some((s) => s.restockAt !== null) ? "on_order" : "out";
}

/** Human lead-time hint derived from availability. */
export function leadTimeForAvailability(a: Availability): string {
  return a === "in_stock"
    ? "1–2 рабочих дня со склада"
    : a === "on_order"
      ? "7–14 рабочих дней"
      : "уточняется по запросу";
}
