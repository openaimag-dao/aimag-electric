"use server";

import { headers } from "next/headers";

import { productService } from "@/server/services/product-service";
import { rateLimit } from "@/lib/security/rate-limit";
import { companyPricesForCurrentUser } from "@/server/services/company-price-service";
import type { CatalogProduct } from "@/types/catalog";

const MAX_IDS = 24;

/** Attaches each product's companyPriceTenge for the viewer's company, if any is set — shared by every list built from getProductsByIds (favorites, compare, recently viewed). */
async function withCompanyPrices(products: CatalogProduct[]): Promise<CatalogProduct[]> {
  if (products.length === 0) return products;
  const byProductId = await companyPricesForCurrentUser(products.map((p) => p.id));
  if (byProductId.size === 0) return products;
  return products.map((p) => ({ ...p, companyPriceTenge: byProductId.get(p.id) ?? null }));
}

/**
 * Resolves a client-held list of product ids (favorites, compare, recently
 * viewed — all stored in localStorage, never on the server) to live catalog
 * data. Public, unauthenticated — rate-limited per IP since it's called
 * straight from the browser on page load.
 */
export async function getProductsByIds(ids: unknown): Promise<CatalogProduct[]> {
  if (!Array.isArray(ids)) return [];
  const clean = ids
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .slice(0, MAX_IDS);
  if (clean.length === 0) return [];

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  const limit = rateLimit(`product-lookup:${ip}`, 60, 60_000);
  if (!limit.ok) return [];

  const products = await productService.getByIds(clean);
  return withCompanyPrices(products);
}

/**
 * Real alternatives for a BOM/project line item — same category, nearest by
 * spec (voltage/cross-section), reusing the deterministic engine already
 * shown as "Похожие товары" on the product page. Public, rate-limited.
 */
export async function getProductAlternatives(productId: unknown): Promise<CatalogProduct[]> {
  if (typeof productId !== "string" || !productId) return [];

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  const limit = rateLimit(`product-alternatives:${ip}`, 60, 60_000);
  if (!limit.ok) return [];

  const [product] = await productService.getByIds([productId]);
  if (!product) return [];
  const related = await productService.getRelated(product);
  return withCompanyPrices(related);
}
