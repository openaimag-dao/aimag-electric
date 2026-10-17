import "server-only";

import { cache } from "react";

import { productRepository } from "@/server/repositories";
import { toDetailDTO, toCatalogDTO } from "@/server/mappers/product";
import { CROSS_SELL_CATEGORIES } from "@/config/cross-sell-categories";
import { roundRobinTake } from "@/lib/round-robin";
import type { CatalogProductDTO, ProductDetailDTO } from "@/server/dto";

/** Nearest-first by voltage/cross-section distance, then by popularity. */
function bySimilarity(product: CatalogProductDTO) {
  return (a: CatalogProductDTO, b: CatalogProductDTO) => {
    const distance = (p: CatalogProductDTO) =>
      Math.abs((p.voltage ?? 0) - (product.voltage ?? 0)) +
      Math.abs((p.crossSection ?? 0) - (product.crossSection ?? 0)) / 10;
    return distance(a) - distance(b) || b.popularity - a.popularity;
  };
}

export const productService = {
  getBySlug: cache(async (slug: string): Promise<ProductDetailDTO | null> => {
    const row = await productRepository.findBySlug(slug);
    return row ? toDetailDTO(row) : null;
  }),

  async allSlugs(): Promise<string[]> {
    const rows = await productRepository.allSlugs();
    return rows.map((r) => r.slug);
  },

  /** Resolve a client-held list of product ids (favorites, compare, recently viewed) to live catalog data, most-recent-first as given by the caller. Silently drops ids that no longer exist or were unpublished. */
  async getByIds(ids: string[]): Promise<CatalogProductDTO[]> {
    if (ids.length === 0) return [];
    const rows = await productRepository.findByIds(ids);
    const byId = new Map(rows.map((r) => [r.id, toCatalogDTO(r)]));
    return ids.map((id) => byId.get(id)).filter((p): p is CatalogProductDTO => Boolean(p));
  },

  /** Resolve a pasted SKU list ("Быстрый заказ") to live catalog data — SKU is unique, exact match only. */
  async getBySkus(skus: string[]): Promise<CatalogProductDTO[]> {
    if (skus.length === 0) return [];
    const rows = await productRepository.findBySkus(skus);
    return rows.map(toCatalogDTO);
  },

  /** Related = same category, nearest by voltage/section, excluding self. */
  async getRelated(product: CatalogProductDTO, limit = 4): Promise<CatalogProductDTO[]> {
    const rows = await productRepository.findByCategory(product.categorySlug, 50);
    return rows
      .map(toCatalogDTO)
      .filter((p) => p.slug !== product.slug)
      .sort(bySimilarity(product))
      .slice(0, limit);
  },

  /**
   * Analog engine: when a product is unavailable, find real in-stock
   * substitutes from the same category, ranked by how closely their specs
   * (voltage, cross-section) match the requested item. Returns [] when the
   * product itself is in stock or no in-stock analog exists — callers
   * should only surface this for out-of-stock/on-order products.
   */
  async getAnalogsInStock(product: CatalogProductDTO, limit = 4): Promise<CatalogProductDTO[]> {
    const rows = await productRepository.findByCategory(product.categorySlug, 50);
    return rows
      .map(toCatalogDTO)
      .filter((p) => p.slug !== product.slug && p.availability === "in_stock")
      .sort(bySimilarity(product))
      .slice(0, limit);
  },

  /**
   * "С этим покупают" — popular products from the categories this
   * product's own category is typically installed alongside (see
   * cross-sell-categories.ts), not more of the same category (that's
   * getRelated above). [] when the category has no mapped pairing.
   */
  async getCrossSell(product: CatalogProductDTO, limit = 4): Promise<CatalogProductDTO[]> {
    const pairedSlugs = CROSS_SELL_CATEGORIES[product.categorySlug] ?? [];
    if (pairedSlugs.length === 0) return [];

    // Round-robin across the paired categories so one popular category
    // doesn't crowd out the others — e.g. with 3 paired categories and a
    // limit of 4, this still pulls from at least two of them.
    const perCategory = Math.max(1, Math.ceil(limit / pairedSlugs.length));
    const lists = await Promise.all(
      pairedSlugs.map(async (slug) =>
        (await productRepository.findByCategory(slug, perCategory)).map(toCatalogDTO)
      )
    );
    return roundRobinTake(lists, limit);
  },
};
