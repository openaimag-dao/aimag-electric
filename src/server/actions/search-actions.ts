"use server";

import { headers } from "next/headers";

import { catalogService } from "@/server/services/catalog-service";
import { rateLimit } from "@/lib/security/rate-limit";

export interface SearchSuggestion {
  id: string;
  slug: string;
  title: string;
  sku: string;
  category: string;
  price: number | null;
  unit: string;
  image: string | null;
}

/**
 * Server Action behind the header search box's autocomplete dropdown.
 * Rate-limited per IP since it fires on every debounced keystroke.
 */
export async function searchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  const limit = rateLimit(`search:${ip}`, 40, 60_000);
  if (!limit.ok) return [];

  const results = await catalogService.searchSuggestions(q, 6);
  return results.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    sku: p.sku,
    category: p.category,
    price: p.price,
    unit: p.unit,
    image: p.image ?? null,
  }));
}
