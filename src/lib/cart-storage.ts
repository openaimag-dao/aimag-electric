import { z } from "zod";
import type { CartItem } from "@/types/cart";

const storedItem = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string(),
  title: z.string().min(1),
  unit: z.string().min(1),
  priceTenge: z.number().finite().nonnegative().nullable(),
  qty: z.number().finite().positive(),
  note: z.string().nullable().optional(),
});

/** Keep usable lines even when a legacy or partially damaged cart contains invalid entries. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items: CartItem[] = [];
    const seen = new Set<string>();
    for (const entry of parsed) {
      const result = storedItem.safeParse(entry);
      if (!result.success || seen.has(result.data.productId)) continue;
      seen.add(result.data.productId);
      items.push(result.data);
    }
    return items;
  } catch {
    return [];
  }
}
