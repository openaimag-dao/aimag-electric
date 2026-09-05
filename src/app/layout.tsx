import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SiteAnalytics } from "@/components/analytics/site-analytics";
import { siteConfig } from "@/config/site";
import { buildOrganizationJsonLd } from "@/lib/org-jsonld";
import { AuthProvider } from "@/components/auth/session-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { CompareProvider } from "@/components/compare/compare-provider";
import { RecentlyViewedProvider } from "@/components/recently-viewed/recently-viewed-provider";
import { getLocale } from "@/i18n/locale-cookie";
import { getDictionary } from "@/i18n/get-dictionary";
import "./globals.css";

const sans = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — электротехническая продукция для бизнеса`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "кабель",
    "провод",
    "СИП",
    "изоляторы",
    "высоковольтное оборудование",
    "электротехника Казахстан",
    "B2B поставки",
  ],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  // Populated once the site is added to Search Console / Яндекс.Вебмастер
  // and a real verification token exists — never a placeholder value.
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.YANDEX_VERIFICATION ? { yandex: process.env.YANDEX_VERIFICATION } : {}),
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { organization, website } = buildOrganizationJsonLd();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return (
    <html lang={locale} className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
        />
        <SiteAnalytics />
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <CompareProvider>
                <RecentlyViewedProvider>
                  <Header locale={locale} dict={dict} />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </RecentlyViewedProvider>
              </CompareProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
