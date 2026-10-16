import type { NextConfig } from "next";
import legacyProductSlugs from "./src/config/legacy-product-slugs.json";

// Kept as a literal here (not imported from src/config/category-merges.ts)
// since next.config.ts runs outside the app's TS path-alias resolution —
// see that file for why these old category slugs redirect to the ones
// that absorbed them.
const MERGED_CATEGORY_SLUGS: Record<string, string> = {
  kabeli: "kabel-provod",
  provoda: "kabel-provod",
  izolyatory: "izolyatory-armatura",
  mufty: "kabelnaya-armatura",
};

// Old product slugs were bare numeric IDs (or, for a dozen, "kabeli-N-N")
// with no keyword value. legacy-product-slugs.json maps every one of them
// to the descriptive slug it was renamed to — generated once from the title
// (see gen-slug-map.mjs, run alongside the matching DB UPDATE) — so existing
// bookmarks, backlinks and indexed search results still resolve.
const LEGACY_PRODUCT_SLUGS: Record<string, string> = legacyProductSlugs;

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://mc.yandex.ru",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com https://stats.g.doubleclick.net https://mc.yandex.ru https://mc.yandex.kz https://mc.yandex.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // The KP-PDF route loads font files via a runtime path.join(), which the
  // bundler's static file tracer can't always follow — make sure they ship
  // with the serverless function regardless.
  outputFileTracingIncludes: {
    "/admin/quotes/[id]/pdf": ["./src/lib/pdf/fonts/**"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Old, now-consolidated category slugs still get direct hits from search
  // and old bookmarks — send them straight to the category that absorbed
  // them instead of a thin/duplicate listing. Extra query params beyond
  // `cat` are not preserved (destination replaces the query string), which
  // is an acceptable tradeoff for what's normally a bare category link.
  async redirects() {
    const categoryRedirects = Object.entries(MERGED_CATEGORY_SLUGS).map(([oldSlug, newSlug]) => ({
      source: "/catalog",
      has: [{ type: "query" as const, key: "cat", value: oldSlug }],
      destination: `/catalog?cat=${newSlug}`,
      permanent: true,
    }));
    const productRedirects = Object.entries(LEGACY_PRODUCT_SLUGS).map(([oldSlug, newSlug]) => ({
      source: `/catalog/${oldSlug}`,
      destination: `/catalog/${newSlug}`,
      permanent: true,
    }));
    return [...categoryRedirects, ...productRedirects];
  },
};

export default nextConfig;
