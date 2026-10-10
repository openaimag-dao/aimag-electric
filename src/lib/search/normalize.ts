const SEPARATOR_CHARS = ["x", "х", "×", "*"] as const;

/**
 * A cable/wire cross-section like "4×2.5" (see scripts/gen-catalog.mjs's
 * `${cores}×${cs}` title template) is written with any of several visually
 * similar digit separators — Latin x, Cyrillic х, the multiplication sign
 * ×, or *. A DB substring match is literal, so a customer typing "4x2.5"
 * would find nothing against a title stored with "×". Expands the query
 * into every separator variant so the caller can search all of them.
 * Returns just [query] unchanged when no digit-bounded separator is present
 * — the common case, so most searches do zero extra work.
 */
export function expandSeparatorVariants(query: string): string[] {
  if (!/\d\s*[xх×*]\s*\d/i.test(query)) return [query];
  const compact = query.replace(/(\d)\s*[xх×*]\s*(\d)/gi, "$1×$2");
  const variants = new Set<string>([query]);
  for (const decimal of [".", ","]) {
    const dimensions = compact.replace(/(\d)[.,](\d)/g, `$1${decimal}$2`);
    for (const sep of SEPARATOR_CHARS) {
      for (const spacing of ["", " "]) {
        variants.add(dimensions.replace(/(\d)×(\d)/g, `$1${spacing}${sep}${spacing}$2`));
      }
    }
  }
  return Array.from(variants);
}
