export type Availability = "in_stock" | "on_order" | "out";

export interface CatalogProduct {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  category: string;
  manufacturer: string;
  /** Артикул / SKU */
  sku: string;
  /** Цена за единицу в тенге; null = "по запросу". */
  price: number | null;
  /** Договорная цена компании текущего пользователя за единицу, если задана staff — не подставляется автоматически, только когда явно прокинута вызывающей страницей. */
  companyPriceTenge?: number | null;
  unit: string; // м / шт / компл
  availability: Availability;
  /** Материал жилы/корпуса: медь, алюминий, стекло, фарфор, пластик, сталь. */
  material: string | null;
  /** Количество жил (для кабелей/проводов). */
  cores: number | null;
  /** Сечение, мм². */
  crossSection: number | null;
  /** Номинальное напряжение, кВ. */
  voltage: number | null;
  /** Все значения атрибутов по Attribute.key (включая material/cores/crossSection/voltage) — источник динамических фильтров. */
  attrs?: Record<string, string | number>;
  /** Признак новинки для сортировки "по новизне". */
  createdAt: string;
  /** Индекс популярности (продажи/просмотры) для сортировки. */
  popularity: number;
  badge?: "Хит" | "Новинка" | "Со склада";
  image?: string | null;
}

export type SortKey = "popular" | "price_asc" | "price_desc" | "new" | "title";

export interface SortOption {
  key: SortKey;
  label: string;
}

/** Активное состояние всех фильтров каталога. */
export interface CatalogFilters {
  q: string;
  categories: string[];
  manufacturers: string[];
  materials: string[];
  cores: number[];
  crossSections: number[];
  voltages: number[];
  /** Значения прочих (динамических) атрибутов по Attribute.key, как строки — см. buildFacets/dynamicAttributes. */
  attrs: Record<string, string[]>;
  priceMin: number | null;
  priceMax: number | null;
  /** true — показывать только товары в наличии. */
  inStockOnly: boolean;
  sort: SortKey;
  page: number;
}

export interface FacetOption<T = string> {
  value: T;
  label: string;
  /** Сколько товаров matched бы этот вариант в текущей выборке. */
  count: number;
}

/** Filterable attribute definition, as managed in /admin/attributes. */
export interface AttributeDef {
  key: string;
  name: string;
  unit: string | null;
  type: "STRING" | "NUMBER" | "BOOLEAN";
  order: number;
}
