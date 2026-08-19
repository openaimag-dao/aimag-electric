import type { CatalogProduct } from "@/types/catalog";

export interface SpecRow {
  label: string;
  value: string;
}

export interface SpecGroup {
  title: string;
  rows: SpecRow[];
}

export interface ProductDocument {
  title: string;
  /** Тип для иконки/подписи: сертификат, паспорт, руководство, чертёж. */
  kind: "certificate" | "datasheet" | "manual" | "drawing";
  /** Относительный путь к PDF в /public/docs. */
  href: string;
  /** Человекочитаемый размер, напр. "1,2 МБ". */
  size: string;
}

export interface ProductReview {
  author: string;
  company?: string;
  rating: number; // 1..5
  date: string; // ISO
  text: string;
}

/**
 * Detail-only fields layered on top of the catalog product. In production these
 * come from the same Prisma Product row (JSON `attributes`, related relations).
 */
export interface ProductDetail extends CatalogProduct {
  /** Расширенное описание (абзацы). */
  description: string[];
  /** URL реальных фото товара (если есть). */
  images?: string[];
  /** Кол-во изображений галереи; используется как fallback, если фото нет. */
  galleryCount: number;
  specGroups: SpecGroup[];
  documents: ProductDocument[];
  reviews: ProductReview[];
  /** Срок поставки, человекочитаемо. */
  leadTime: string;
  /** Гарантия. */
  warranty: string;
  /** Единица кратности отгрузки, напр. "бухта 100 м". */
  packaging?: string;
}
