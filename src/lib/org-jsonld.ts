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
    // Square, ≥112×112 per Google's logo guideline for Organization markup.
    logo: `${siteConfig.url}/apple-icon.png`,
    description: siteConfig.description,
    areaServed: [
      { "@type": "City", name: siteConfig.contacts.address.addressLocality },
      { "@type": "Country", name: "Kazakhstan" },
    ],
    address: {
      "@type": "PostalAddress",
      ...siteConfig.contacts.address,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.contacts.phone,
      email: siteConfig.contacts.email,
      contactType: "sales",
      areaServed: "KZ",
      availableLanguage: ["ru", "kk"],
    },
  };

  // Separate LocalBusiness entity (rather than retyping Organization itself)
  // for the real Shymkent office/warehouse — openingHoursSpecification and a
  // place-bound address are schema.org properties of LocalBusiness, not
  // Organization. Uses only facts already published elsewhere on the site
  // (siteConfig.contacts): real street address and real working hours.
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: siteConfig.contacts.phone,
    email: siteConfig.contacts.email,
    address: {
      "@type": "PostalAddress",
      ...siteConfig.contacts.address,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
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

  return { organization, website, localBusiness };
}
