import type { Availability } from "@/types/catalog";
import type { ProductDocument, ProductReview, SpecGroup } from "@/types/product-detail";

/**
 * Domain DTOs returned by the service layer to the UI. They intentionally
 * mirror the shapes the existing components consume (CatalogProduct /
 * ProductDetail), so pages swap their data source without changing markup.
 */

export interface CategoryDTO {
  slug: string;
  title: string;
  description: string | null;
  spec: string | null;
  icon: string | null;
}

export interface BrandDTO {
  slug: string;
  name: string;
  origin: string | null;
}

export interface CatalogProductDTO {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  category: string;
  manufacturer: string;
  sku: string;
  price: number | null; // в тенге (из тиынов)
  unit: string;
  availability: Availability;
  material: string | null;
  cores: number | null;
  crossSection: number | null;
  voltage: number | null;
  createdAt: string;
  popularity: number;
  badge?: "Хит" | "Новинка" | "Со склада";
  image?: string | null;
}

export interface ProductDetailDTO extends CatalogProductDTO {
  description: string[];
  images: string[];
  galleryCount: number;
  specGroups: SpecGroup[];
  documents: ProductDocument[];
  reviews: ProductReview[];
  leadTime: string;
  warranty: string;
  packaging?: string;
}
