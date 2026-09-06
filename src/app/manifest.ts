import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/** Web app manifest — improves mobile installability and search presentation. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0e1622",
    theme_color: "#0e1622",
    lang: "ru",
    categories: ["business", "shopping"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
