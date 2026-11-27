import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * robots.txt — allow crawling of public pages, disallow the admin panel,
 * account area, private КП links and API routes. Points crawlers at the sitemap.
 *
 * Utility pages linked from every page (/cart, /compare, /favorites,
 * /quick-order, /login, /register) are deliberately NOT disallowed: each one
 * carries `robots: { index: false }`, and Googlebot can only see that noindex
 * if it is allowed to fetch the page. Disallowing them made Search Console
 * report "Заблокировано в файле robots.txt" and risked "Indexed, though
 * blocked by robots.txt" for URLs Google found through links.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/account", "/account/", "/api/", "/kp/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
