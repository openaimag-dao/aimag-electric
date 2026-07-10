import "server-only";

import { cache } from "react";

import { productRepository } from "@/server/repositories";
import { toDetailDTO, toCatalogDTO } from "@/server/mappers/product";
import type { CatalogProductDTO, ProductDetailDTO } from "@/server/dto";

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
  async getRelated(
    product: CatalogProductDTO,
    limit = 4
  ): Promise<CatalogProductDTO[]> {
    const rows = await productRepository.findByCategory(product.categorySlug);
    return rows
      .map(toCatalogDTO)
      .filter((p) => p.slug !== product.slug)
      .sort((a, b) => {
        const da =
          Math.abs((a.voltage ?? 0) - (product.voltage ?? 0)) +
          Math.abs((a.crossSection ?? 0) - (product.crossSection ?? 0)) / 10;
        const db =
          Math.abs((b.voltage ?? 0) - (product.voltage ?? 0)) +
          Math.abs((b.crossSection ?? 0) - (product.crossSection ?? 0)) / 10;
        return da - db || b.popularity - a.popularity;
      })
      .slice(0, limit);
  },
};
