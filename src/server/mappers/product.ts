import type { PriceKind, ProductBadge } from "@prisma/client";

import { tiynToTenge } from "@/lib/money";
import { deriveAvailabilityFromStock, leadTimeForAvailability } from "@/lib/availability";
import { isPlaceholderBrand } from "@/lib/brand";

import type { CatalogProductDTO, ProductDetailDTO } from "@/server/dto";
import type { Availability } from "@/types/catalog";
import type { ProductDocument, ProductReview, SpecGroup } from "@/types/product-detail";
import type { ProductWithRelations } from "@/server/repositories/types";

const badgeLabels: Record<ProductBadge, "Хит" | "Новинка" | "Со склада"> = {
  HIT: "Хит",
  NEW: "Новинка",
  IN_STOCK: "Со склада",
};

const docKindMap: Record<string, ProductDocument["kind"]> = {
  CERTIFICATE: "certificate",
  DATASHEET: "datasheet",
  MANUAL: "manual",
  DRAWING: "drawing",
};

/**
 * Minimal product shape toCatalogDTO needs. `ProductWithRelations` (full
 * detail include) and `ProductForListing` (lean listing select) both
 * structurally satisfy this, so one mapper serves both call sites.
 */
interface ProductForCatalog {
  id: string;
  slug: string;
  title: string;
  sku: string;
  unit: string;
  createdAt: Date;
  popularity: number;
  badge: ProductBadge | null;
  category: { slug: string; title: string };
  brand: { name: string };
  images: { url: string | null }[];
  prices: { kind: PriceKind; amount: number | null; validFrom: Date; validTo: Date | null }[];
  stock: { quantity: number; restockAt: Date | null }[];
  values: {
    valueString: string | null;
    valueNumber: number | null;
    valueBool: boolean | null;
    attribute: { key: string };
  }[];
}

/** Read a typed attribute value by attribute key. */
/** Build a key→typed-value map from a product's attribute values (one pass). */
function attrMap(p: ProductForCatalog): Map<string, string | number | boolean> {
  const map = new Map<string, string | number | boolean>();
  for (const v of p.values) {
    const value =
      v.valueNumber !== null ? v.valueNumber : v.valueBool !== null ? v.valueBool : v.valueString;
    if (value !== null && value !== undefined) map.set(v.attribute.key, value);
  }
  return map;
}

/** Availability is derived from live stock across warehouses. */
function deriveAvailability(p: ProductForCatalog): Availability {
  return deriveAvailabilityFromStock(p.stock);
}

/** Effective base price: lowest currently-valid BASE price, in tenge. */
function derivePrice(p: ProductForCatalog): number | null {
  const now = Date.now();
  const active = p.prices.filter(
    (pr) =>
      pr.amount !== null &&
      pr.validFrom.getTime() <= now &&
      (pr.validTo === null || pr.validTo.getTime() >= now)
  );
  if (active.length === 0) return null;
  // Prefer PROMO, then BASE; amounts stored in тиын → convert to тенге.
  const promo = active.filter((pr) => pr.kind === "PROMO");
  const pool = promo.length ? promo : active;
  const minTiyn = Math.min(...pool.map((pr) => pr.amount as number));
  return tiynToTenge(minTiyn);
}

/** Ordered, non-empty image URLs for a product. */
function productImages(p: ProductForCatalog): string[] {
  return p.images.map((i) => i.url).filter((u): u is string => Boolean(u));
}

/** Every attribute value, stringified — feeds the catalog's dynamic facets (see buildFacets). */
function attrBag(attrs: Map<string, string | number | boolean>): Record<string, string | number> {
  const bag: Record<string, string | number> = {};
  for (const [key, value] of attrs) {
    bag[key] = typeof value === "boolean" ? (value ? "Да" : "Нет") : value;
  }
  return bag;
}

export function toCatalogDTO(p: ProductForCatalog): CatalogProductDTO {
  const attrs = attrMap(p);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    categorySlug: p.category.slug,
    category: p.category.title,
    manufacturer: p.brand.name,
    sku: p.sku,
    price: derivePrice(p),
    unit: p.unit,
    availability: deriveAvailability(p),
    material: (attrs.get("material") as string) ?? null,
    cores: (attrs.get("cores") as number) ?? null,
    crossSection: (attrs.get("crossSection") as number) ?? null,
    voltage: (attrs.get("voltage") as number) ?? null,
    attrs: attrBag(attrs),
    createdAt: p.createdAt.toISOString().slice(0, 10),
    popularity: p.popularity,
    badge: p.badge ? badgeLabels[p.badge] : undefined,
    image: productImages(p)[0] ?? null,
  };
}

function buildSpecGroups(p: ProductWithRelations): SpecGroup[] {
  const attrs = attrMap(p);
  const main: { label: string; value: string }[] = [];
  // The DB carries a placeholder "Без бренда" Brand row for unmapped
  // manufacturers — don't present that as if it were real product info.
  if (!isPlaceholderBrand(p.brand.name)) main.push({ label: "Производитель", value: p.brand.name });
  main.push({ label: "Артикул", value: p.sku }, { label: "Категория", value: p.category.title });
  const material = attrs.get("material");
  if (material) main.push({ label: "Материал", value: String(material) });

  const electrical: { label: string; value: string }[] = [];
  const voltage = attrs.get("voltage");
  const cores = attrs.get("cores");
  const cs = attrs.get("crossSection");
  if (voltage !== undefined)
    electrical.push({ label: "Номинальное напряжение", value: `${voltage} кВ` });
  if (cores !== undefined) electrical.push({ label: "Количество жил", value: String(cores) });
  if (cs !== undefined) electrical.push({ label: "Сечение", value: `${cs} мм²` });

  // Deliberately just the two real fields we have — a blanket "−50…+50 °C,
  // УХЛ1 / ГОСТ / ТР ТС" used to be hardcoded here for every product
  // regardless of category, which is a fabricated technical/compliance claim
  // (wrong for plenty of real SKUs) rather than actual catalog data.
  const operational = [
    { label: "Единица измерения", value: p.unit },
    { label: "Гарантия", value: p.warranty ?? "12 месяцев" },
  ];

  const groups: SpecGroup[] = [{ title: "Основные параметры", rows: main }];
  if (electrical.length) groups.push({ title: "Электрические характеристики", rows: electrical });
  groups.push({ title: "Эксплуатация и стандарты", rows: operational });
  return groups;
}

function mapDocuments(p: ProductWithRelations): ProductDocument[] {
  return p.documents.map((d) => ({
    title: d.title,
    kind: docKindMap[d.kind] ?? "datasheet",
    href: d.url,
    size: d.size ?? "",
  }));
}

function mapReviews(p: ProductWithRelations): ProductReview[] {
  return p.reviews.map((r) => ({
    author: r.author,
    company: r.company ?? undefined,
    rating: r.rating,
    date: r.createdAt.toISOString().slice(0, 10),
    text: r.text,
  }));
}

export function toDetailDTO(p: ProductWithRelations): ProductDetailDTO {
  const base = toCatalogDTO(p);
  const images = productImages(p);
  const galleryCount = images.length > 0 ? images.length : 3;
  return {
    ...base,
    description: (p.description ?? "").split("\n\n").filter(Boolean),
    images,
    galleryCount,
    specGroups: buildSpecGroups(p),
    documents: mapDocuments(p),
    reviews: mapReviews(p),
    leadTime: p.leadTime ?? leadTimeForAvailability(base.availability),
    warranty: p.warranty ?? "12 месяцев",
    packaging: p.packaging ?? undefined,
  };
}
