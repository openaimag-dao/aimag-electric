/** Presentation-only cleanup: preserves marks, suffixes, ratings and the stored title. */
export function normalizeProductTitle(title: string): string {
  const compact = title.trim().replace(/\s+/g, " ");
  if (!/^(кабель|провод)\s/i.test(compact)) return compact;
  return compact.replace(
    /(\d+(?:[.,]\d+)?)\s*[xх×*]\s*(\d+(?:[.,]\d+)?)/gi,
    (_, cores: string, section: string) => `${cores.replace(".", ",")}×${section.replace(".", ",")}`
  );
}
