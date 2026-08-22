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
}

export interface SpecRowInput {
  sku: string;
  title: string;
  manufacturer: string;
}

export interface MatchCandidateResult<T extends MatchableProduct> {
  product: T;
  score: number;
  matchedFields: string[];
  differentFields: string[];
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

  const score = skuExact ? Math.max(tScore, EXACT_THRESHOLD) : tScore;
  return { product, score, matchedFields, differentFields };
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
