import { siteConfig } from "@/config/site";

/**
 * Organization + WebSite JSON-LD for the site root. Establishes the brand
 * entity (name, contact, area served) and the site search action for rich
 * results. Rendered once in the root layout.
 */
export function buildOrganizationJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    areaServed: { "@type": "Country", name: "Kazakhstan" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.contacts.phone,
      email: siteConfig.contacts.email,
      contactType: "sales",
      areaServed: "KZ",
      availableLanguage: ["ru", "kk"],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "ru-KZ",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/catalog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return { organization, website };
}
