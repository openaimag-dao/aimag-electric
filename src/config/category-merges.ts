/**
 * Old category slugs that predate the SEO rewrite (see category-seo.ts),
 * which introduced kabel-provod/izolyatory-armatura/kabelnaya-armatura as
 * consolidated, content-rich replacements — mapped to the slug that
 * absorbed them. The originals were never fully retired: both the Category
 * rows and a handful of stray products still exist, so without this the
 * mega menu and sitemap show e.g. "Кабели" (12 products) right next to
 * "Кабель и провод" (126 products) as if they were unrelated categories.
 *
 * Used to hide the old slugs from public navigation (loadNavCategories,
 * sitemap.ts) while next.config.ts's redirects() sends any existing link
 * to the surviving category. This only hides the symptom — an admin still
 * needs to reassign the stray products (via /admin/products' bulk category
 * change) and delete these Category rows (via /admin/categories) to
 * actually finish the cleanup.
 */
export const mergedCategorySlugs: Record<string, string> = {
  kabeli: "kabel-provod",
  provoda: "kabel-provod",
  izolyatory: "izolyatory-armatura",
  mufty: "kabelnaya-armatura",
};
