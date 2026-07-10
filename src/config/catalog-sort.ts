import type { SortOption } from "@/types/catalog";

export const sortOptions: SortOption[] = [
  { key: "popular", label: "По популярности" },
  { key: "price_asc", label: "Цена: по возрастанию" },
  { key: "price_desc", label: "Цена: по убыванию" },
  { key: "new", label: "По новизне" },
  { key: "title", label: "По названию" },
];

export const PAGE_SIZE = 9;

/** Human labels for availability filter + badges. */
export const availabilityLabels: Record<string, string> = {
  in_stock: "В наличии",
  on_order: "Под заказ",
  out: "Нет в наличии",
};
