/**
 * Reference cable cross-section calculator.
 *
 * Ampacity tables are the commonly published ПУЭ (табл. 1.3.4–1.3.5) values
 * for a cable laid openly in air — the standard reference figure, not a
 * substitute for a real electrical design. Real installations also depend
 * on grouping, ambient temperature, protection-device coordination and
 * voltage drop over distance, which is why the UI always frames the result
 * as a preliminary estimate and recommends rounding up, never down.
 */

export type CableMaterial = "copper" | "aluminum";
export type NetworkPhase = "single" | "three";

export interface AmpacityRow {
  crossSectionMm2: number;
  currentA: number;
}

/** Copper (ВВГ), 2–4 core, open-air installation. */
const COPPER_AMPACITY: AmpacityRow[] = [
  { crossSectionMm2: 1.5, currentA: 19 },
  { crossSectionMm2: 2.5, currentA: 27 },
  { crossSectionMm2: 4, currentA: 38 },
  { crossSectionMm2: 6, currentA: 46 },
  { crossSectionMm2: 10, currentA: 70 },
  // 90A at 16mm² matches the reference table already published in the
  // "Как выбрать сечение кабеля" blog article (articles.ts) — kept in sync
  // so the two pages don't show conflicting numbers for the same size.
  { crossSectionMm2: 16, currentA: 90 },
  { crossSectionMm2: 25, currentA: 115 },
  { crossSectionMm2: 35, currentA: 135 },
  { crossSectionMm2: 50, currentA: 175 },
  { crossSectionMm2: 70, currentA: 215 },
  { crossSectionMm2: 95, currentA: 260 },
  { crossSectionMm2: 120, currentA: 300 },
  { crossSectionMm2: 150, currentA: 340 },
  { crossSectionMm2: 185, currentA: 385 },
  { crossSectionMm2: 240, currentA: 435 },
];

/** Aluminum (АВВГ), 2–4 core, open-air installation — not sold below 2.5 mm². */
const ALUMINUM_AMPACITY: AmpacityRow[] = [
  { crossSectionMm2: 2.5, currentA: 20 },
  { crossSectionMm2: 4, currentA: 28 },
  { crossSectionMm2: 6, currentA: 36 },
  { crossSectionMm2: 10, currentA: 50 },
  { crossSectionMm2: 16, currentA: 60 },
  { crossSectionMm2: 25, currentA: 85 },
  { crossSectionMm2: 35, currentA: 100 },
  { crossSectionMm2: 50, currentA: 135 },
  { crossSectionMm2: 70, currentA: 165 },
  { crossSectionMm2: 95, currentA: 205 },
  { crossSectionMm2: 120, currentA: 240 },
  { crossSectionMm2: 150, currentA: 270 },
  { crossSectionMm2: 185, currentA: 310 },
  { crossSectionMm2: 240, currentA: 350 },
];

export function ampacityTable(material: CableMaterial): AmpacityRow[] {
  return material === "copper" ? COPPER_AMPACITY : ALUMINUM_AMPACITY;
}

/** Cross-section values the catalog actually has `cs` filter facets for (see catalog-url.ts). */
export const CATALOG_CROSS_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];

const SQRT3 = Math.sqrt(3);

/** Load current from power — single-phase 220V or three-phase 380V, cosφ fixed at a conservative 0.95. */
export function currentFromPower(powerKw: number, phase: NetworkPhase): number {
  const cosPhi = 0.95;
  const watts = powerKw * 1000;
  return phase === "single" ? watts / (220 * cosPhi) : watts / (SQRT3 * 380 * cosPhi);
}

export interface CrossSectionRecommendation {
  currentA: number;
  row: AmpacityRow | null;
  /** True when the load current exceeds every tabulated size — no safe recommendation. */
  exceedsTable: boolean;
}

/** Smallest cross-section whose tabulated ampacity is at or above the load current — never rounds down. */
export function recommendCrossSection(
  currentA: number,
  material: CableMaterial
): CrossSectionRecommendation {
  const table = ampacityTable(material);
  const row = table.find((r) => r.currentA >= currentA) ?? null;
  return { currentA, row, exceedsTable: row === null };
}
