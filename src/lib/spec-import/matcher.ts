/**
 * Deterministic matching for the "Загрузить ТЗ" flow — no AI, no invented
 * data. A parsed spec row is scored against real catalog candidates (found
 * via the existing catalog search) purely by SKU/title normalization, and
 * classified into one of three tiers the reviewer sees before anything is
 * written to a project.
 */

export type MatchTier = "exact" | "possible" | "not_found";

export interface MatchableProduct {
  id: string;
  sku: string;
  title: string;
  manufacturer: string;
  /** Real structured attrs, when the catalog has them — never inferred from text on this side. */
  cores?: number | null;
  crossSection?: number | null;
  voltage?: number | null;
}

export interface SpecRowInput {
  sku: string;
  title: string;
  manufacturer: string;
  /** From the file's own "Напряжение" column, when present — never guessed from title text. */
  voltage?: number | null;
  /** From the file's own "Сечение" column, when present — covers products whose title doesn't embed an "NxM" cable-size token (e.g. armature/fittings), unlike extractDimensions(). */
  crossSection?: number | null;
}

export interface MatchCandidateResult<T extends MatchableProduct> {
  product: T;
  score: number;
  matchedFields: string[];
  differentFields: string[];
  /** Set only when the file has real technical data (title-embedded cable size, or a Напряжение column value) that contradicts the matched product's real attrs — never a guess. */
  technicalWarning: string | null;
}

export interface RowMatchResult<T extends MatchableProduct> {
  tier: MatchTier;
  candidates: MatchCandidateResult<T>[];
}

const EXACT_THRESHOLD = 0.98;
const POSSIBLE_THRESHOLD = 0.4;
const MAX_CANDIDATES = 3;

/** Cyrillic "х" ↔ Latin "x", "×"/"*" as cable-size separators, collapsed whitespace. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/х/g, "x")
    .replace(/[×*]/g, "x")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(/[^a-zа-я0-9x]+/i)
      .filter(Boolean)
  );
}

/** Jaccard similarity of normalized word tokens — 0..1. */
function titleSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

interface DimensionSignal {
  cores: number;
  crossSection: number;
}

/**
 * Extracts an embedded "<cores>x<crossSection>" cable-size token from raw
 * free text (e.g. "Кабель ВВГ 3х2.5" -> {cores:3, crossSection:2.5}). Runs
 * on the untouched string, not normalize()'s output, since normalize()
 * strips the decimal separator crossSection needs. Returns null when no
 * such token is present — never invents a size.
 */
function extractDimensions(title: string): DimensionSignal | null {
  const match = title.match(/(\d+)\s*[xх×*]\s*(\d+(?:[.,]\d+)?)/i);
  if (!match) return null;
  const cores = Number(match[1]);
  const crossSection = Number(match[2].replace(",", "."));
  if (!Number.isFinite(cores) || !Number.isFinite(crossSection)) return null;
  return { cores, crossSection };
}

function scoreCandidate<T extends MatchableProduct>(
  row: SpecRowInput,
  product: T
): MatchCandidateResult<T> {
  const matchedFields: string[] = [];
  const differentFields: string[] = [];

  const skuExact = Boolean(row.sku) && normalize(row.sku) === normalize(product.sku);
  if (row.sku) (skuExact ? matchedFields : differentFields).push("Артикул");

  const tScore = titleSimilarity(row.title, product.title);
  if (tScore >= 0.6) matchedFields.push("Название");
  else if (row.title) differentFields.push("Название");

  if (row.manufacturer) {
    const mExact = normalize(row.manufacturer) === normalize(product.manufacturer);
    (mExact ? matchedFields : differentFields).push("Производитель");
  }

  const warnings: string[] = [];

  const rowDims = extractDimensions(row.title);
  if (
    rowDims &&
    product.cores != null &&
    product.crossSection != null &&
    (rowDims.cores !== product.cores || rowDims.crossSection !== product.crossSection)
  ) {
    warnings.push(
      `В файле: ${rowDims.cores}×${rowDims.crossSection} мм², у товара: ${product.cores}×${product.crossSection} мм² — сверьте сечение`
    );
  } else if (
    // Only when the title didn't already supply a size — avoids a second,
    // redundant "сверьте сечение" warning on cable/wire/splice rows that
    // already get the combined cores×crossSection check above. This is what
    // covers categories like armature/fittings, whose titles are a single
    // number ("Зажим анкерный ЗАБ 16"), not an "NxM" token.
    !rowDims &&
    row.crossSection != null &&
    product.crossSection != null &&
    row.crossSection !== product.crossSection
  ) {
    warnings.push(
      `В файле: ${row.crossSection} мм², у товара: ${product.crossSection} мм² — сверьте сечение`
    );
  }

  if (row.voltage != null && product.voltage != null && row.voltage !== product.voltage) {
    warnings.push(
      `В файле: ${row.voltage} кВ, у товара: ${product.voltage} кВ — сверьте напряжение`
    );
  }

  const technicalWarning = warnings.length > 0 ? warnings.join(" · ") : null;

  const score = skuExact ? Math.max(tScore, EXACT_THRESHOLD) : tScore;
  return { product, score, matchedFields, differentFields, technicalWarning };
}

/** Rank real candidates for one spec row and classify into a tier. Never invents a candidate. */
export function matchRow<T extends MatchableProduct>(
  row: SpecRowInput,
  candidates: T[]
): RowMatchResult<T> {
  const scored = candidates
    .map((p) => scoreCandidate(row, p))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);

  const best = scored[0]?.score ?? 0;
  const tier: MatchTier =
    best >= EXACT_THRESHOLD ? "exact" : best >= POSSIBLE_THRESHOLD ? "possible" : "not_found";

  return { tier, candidates: tier === "not_found" ? [] : scored };
}
