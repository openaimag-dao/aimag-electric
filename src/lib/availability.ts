import type { Availability } from "@/types/catalog";

/** Minimal stock shape needed to derive availability. */
export interface StockLike {
  quantity: number;
  restockAt: Date | null;
}

/** Same threshold the admin dashboard uses for its own low-stock list (see admin-service.ts dashboardInsights). */
const LOW_STOCK_THRESHOLD = 5;

function totalStock(stock: StockLike[]): number {
  return stock.reduce((sum, s) => sum + s.quantity, 0);
}

/**
 * Single source of truth for availability: in stock if any warehouse has a
 * positive quantity; otherwise on order if a restock date exists; else out.
 */
export function deriveAvailabilityFromStock(stock: StockLike[]): Availability {
  const total = totalStock(stock);
  if (total > 0) return "in_stock";
  return stock.some((s) => s.restockAt !== null) ? "on_order" : "out";
}

/**
 * True when total stock across all warehouses is positive but at or below
 * LOW_STOCK_THRESHOLD — surfaced to customers as a gentle scarcity signal
 * ("осталось немного") on top of the plain "в наличии" badge.
 */
export function isLowStock(stock: StockLike[]): boolean {
  const total = totalStock(stock);
  return total > 0 && total <= LOW_STOCK_THRESHOLD;
}

/** Human lead-time hint derived from availability. */
export function leadTimeForAvailability(a: Availability): string {
  return a === "in_stock"
    ? "1–2 рабочих дня со склада"
    : a === "on_order"
      ? "7–14 рабочих дней"
      : "уточняется по запросу";
}
