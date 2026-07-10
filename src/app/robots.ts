import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * robots.txt — allow crawling of public pages, disallow the admin panel,
 * account area, and auth/API routes. Points crawlers at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/account", "/account/", "/api/", "/login"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
