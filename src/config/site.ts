export const siteConfig = {
  name: "AIMAG ELECTRIC",
  shortName: "AIMAG",
  description:
    "B2B-поставщик электротехнической продукции для бизнеса и промышленности Казахстана: кабели, провода, изоляторы, арматура СИП, муфты, автоматы и высоковольтное оборудование.",
  // Canonical origin used for sitemap.xml, robots.txt, JSON-LD, and Open
  // Graph/canonical URLs — override with SITE_URL once a custom domain is
  // connected, so switching domains later is an env var change, not a
  // redeploy of this file.
  url: process.env.SITE_URL || "https://aimag-electric.vercel.app",
  locale: "ru_KZ",
  contacts: {
    phone: "+7 705 615-17-17",
    /** WhatsApp в международном формате без плюса и пробелов. */
    whatsapp: "77056151717",
    email: "sales@aimag-electric.kz",
    city: "Шымкент, Казахстан",
    workingHours: "Пн–Пт, 09:00–18:00",
  },
} as const;

export type SiteConfig = typeof siteConfig;
