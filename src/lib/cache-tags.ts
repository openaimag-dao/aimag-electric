/** Cache tags for tag-based revalidation across the catalog read paths. */
export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  brands: "brands",
  posts: "posts",
  caseStudies: "case-studies",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
