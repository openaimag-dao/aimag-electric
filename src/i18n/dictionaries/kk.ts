import type { Dictionary } from "@/i18n/types";

/**
 * DRAFT — a best-effort draft for a small set of standard, unambiguous nav
 * words, not verified by a native Kazakh speaker or professional
 * translator. Safe to ship as a starting point (it only affects five
 * navigation labels), but should get a native-speaker review before anyone
 * treats it as final. The rest of the site (product data, blog, static
 * pages) has no Kazakh copy at all yet — that's real content that needs a
 * real translator, not something to fabricate here.
 */
export const kk: Dictionary = {
  nav: [
    { label: "Каталог", href: "/catalog" },
    { label: "Санаттар", href: "/#categories" },
    { label: "Компания туралы", href: "/o-kompanii" },
    { label: "Жеткізу", href: "/dostavka" },
    { label: "Байланыс", href: "/kontakty" },
  ],
  languageSwitcher: {
    label: "Тіл",
    ru: "Русский",
    kk: "Қазақша",
  },
};
