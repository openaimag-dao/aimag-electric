"use server";

import { headers } from "next/headers";

import { catalogService } from "@/server/services/catalog-service";
import { rateLimit } from "@/lib/security/rate-limit";
import { searchLogRepository } from "@/server/repositories/search-log-repository";
import { logger } from "@/lib/logger";

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
  const suggestions = results.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    sku: p.sku,
    category: p.category,
    price: p.price,
    unit: p.unit,
    image: p.image ?? null,
  }));

  // Keep autocomplete telemetry separate from confirmed catalog searches.
  // Logging is best-effort and must never break search.
  try {
    await searchLogRepository.logSearch(q, suggestions.length, "suggestion");
  } catch (e) {
    logger.error("search.log_failed", { error: String(e) });
  }

  return suggestions;
}

/** Records a confirmed catalog search, distinguishing filtered searches from full-catalog demand. */
export async function logCatalogSearch(
  query: string,
  resultCount: number,
  hasFilters = false
): Promise<void> {
  if (
    typeof query !== "string" ||
    !Number.isSafeInteger(resultCount) ||
    resultCount < 0 ||
    resultCount > 2_147_483_647
  )
    return;
  const q = query.trim().slice(0, 100);
  if (!q) return;

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  const limit = rateLimit(`search-catalog:${ip}`, 40, 60_000);
  if (!limit.ok) return;

  try {
    await searchLogRepository.logSearch(
      q,
      resultCount,
      hasFilters === true ? "search_filtered" : "search_submitted"
    );
  } catch (e) {
    logger.error("search.log_catalog_failed", { error: String(e) });
  }
}

/** Records that a suggestion (or "show all results") was actually clicked — the click-through half of the same demand signal. Fire-and-forget from the client; a lost beacon just means one fewer data point, never a broken click. */
export async function logSearchClick(query: string, productSlug: string): Promise<void> {
  const q = query.trim().slice(0, 100);
  const slug = productSlug.trim().slice(0, 200);
  if (!q || !slug) return;

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  const limit = rateLimit(`search-click:${ip}`, 40, 60_000);
  if (!limit.ok) return;

  try {
    await searchLogRepository.logClick(q, slug);
  } catch (e) {
    logger.error("search.log_click_failed", { error: String(e) });
  }
}
