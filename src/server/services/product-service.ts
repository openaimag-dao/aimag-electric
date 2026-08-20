import "server-only";

import { cache } from "react";

import { productRepository } from "@/server/repositories";
import { toDetailDTO, toCatalogDTO } from "@/server/mappers/product";
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
};
