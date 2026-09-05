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
  image: string | null;
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
  /** Every attribute value by Attribute.key (includes material/cores/crossSection/voltage too) — drives dynamic facets. */
  attrs: Record<string, string | number>;
  createdAt: string;
  popularity: number;
  badge?: "Хит" | "Новинка" | "Со склада";
  image?: string | null;
}

export interface PostDTO {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  publishedAt: string;
}

export interface PostDetailDTO extends PostDTO {
  content: string;
}

export interface CaseStudyDTO {
  slug: string;
  title: string;
  scope: string;
  location: string;
  year: string;
  metric: string;
  metricLabel: string;
  category: string;
}

export interface CaseStudyDetailDTO extends CaseStudyDTO {
  description: string | null;
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
