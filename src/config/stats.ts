export interface Stat {
  value: string;
  label: string;
}

function formatCatalogCount(count: number): string {
  if (count <= 0) return "0";
  const rounded = Math.max(100, Math.floor(count / 100) * 100);
  return `${rounded.toLocaleString("ru-RU")}+`;
}

/**
 * Trust signals surfaced in the hero. The catalog-size stat is computed from
 * the real published product count (rounded down to the nearest 100, so it
 * doesn't need updating on every single product add/remove) — not a static
 * marketing number that can drift from reality.
 */
export function getHeroStats(productCount: number): Stat[] {
  return [
    { value: "12+", label: "лет на рынке электротехники" },
    { value: formatCatalogCount(productCount), label: "позиций в каталоге" },
    { value: "17", label: "регионов поставки по РК" },
    { value: "15 мин", label: "на подготовку КП" },
  ];
}
