/** Soft "possible duplicate" heuristic — same brand + very similar title. Not a hard block: exact SKU dupes are already prevented by the DB's unique constraint. */

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[«»"'.,]/g, "")
    .replace(/\s+/g, " ");
}

/** Jaccard similarity over normalized word sets — cheap, dependency-free, good enough for a soft warning. */
export function titleSimilarity(a: string, b: string): number {
  const wa = new Set(normalizeTitle(a).split(" ").filter(Boolean));
  const wb = new Set(normalizeTitle(b).split(" ").filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let intersection = 0;
  for (const w of wa) if (wb.has(w)) intersection++;
  const union = wa.size + wb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export const DUPLICATE_TITLE_SIMILARITY_THRESHOLD = 0.6;
