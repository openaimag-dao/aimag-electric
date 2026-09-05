import "server-only";

import { productRepository } from "@/server/repositories";
import { toCatalogDTO } from "@/server/mappers/product";
import type { CartItem } from "@/types/cart";

export interface CartRef {
  productId: string;
  qty: number;
}

export interface ResolvedCart {
  items: CartItem[];
  /** Refs whose product no longer exists or was unpublished since the ref was made. */
  droppedCount: number;
}

/**
 * Re-derives real, current title/sku/unit/price from the catalog for a set
 * of (productId, qty) refs. Used for anything that leaves the browser as a
 * document or a link (export, share) — never trusts client-cached title/
 * price for those, same reasoning as submitQuote's server-side price
 * resolution.
 */
export async function resolveCartRefs(refs: CartRef[]): Promise<ResolvedCart> {
  if (refs.length === 0) return { items: [], droppedCount: 0 };

  const products = await productRepository.findByIds(refs.map((r) => r.productId));
  const dtoById = new Map(products.map((p) => [p.id, toCatalogDTO(p)]));

  const items: CartItem[] = [];
  let droppedCount = 0;
  for (const ref of refs) {
    const dto = dtoById.get(ref.productId);
    if (!dto) {
      droppedCount++;
      continue;
    }
    items.push({
      productId: dto.id,
      slug: dto.slug,
      sku: dto.sku,
      title: dto.title,
      unit: dto.unit,
      priceTenge: dto.price,
      qty: ref.qty,
    });
  }
  return { items, droppedCount };
}
