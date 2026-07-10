export interface Manufacturer {
  name: string;
  /** Country of origin — reinforces breadth and sourcing credibility. */
  origin: string;
  category: string;
}

/**
 * Manufacturers rendered as a logo/wordmark wall. We draw wordmarks in the
 * component (no low-quality raster logos), so this stays lightweight.
 */
export const manufacturers: Manufacturer[] = [
  { name: "Камкабель", origin: "Пермь, РФ", category: "Кабели" },
  { name: "Севкабель", origin: "СПб, РФ", category: "Кабели" },
  { name: "Сарансккабель", origin: "Саранск, РФ", category: "Кабели" },
  { name: "KazEnergoKabel", origin: "Павлодар, РК", category: "Кабели" },
  { name: "IEK", origin: "Москва, РФ", category: "Автоматы" },
  { name: "EKF", origin: "Москва, РФ", category: "Автоматы" },
  { name: "ЭЛСИ", origin: "Алматы, РК", category: "СИП" },
  { name: "Ниcentr", origin: "РФ", category: "Изоляторы" },
  { name: "Райхем", origin: "Муфты", category: "Муфты" },
  { name: "КЭАЗ", origin: "Курск, РФ", category: "НВА" },
  { name: "Schneider", origin: "Франция", category: "НВА" },
  { name: "ABB", origin: "Швейцария", category: "ВВ оборудование" },
];
