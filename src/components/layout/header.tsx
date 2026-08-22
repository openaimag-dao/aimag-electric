import Link from "next/link";
import { Phone } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { SearchBar } from "@/components/layout/search-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { AccountLink } from "@/components/auth/account-link";
import { CartBadge } from "@/components/cart/cart-badge";
import { FavoritesBadge } from "@/components/favorites/favorites-badge";
import { CompareBadge } from "@/components/compare/compare-badge";
import { mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      {/* Utility strip */}
      <div className="hidden border-b border-border/70 bg-primary text-primary-foreground lg:block">
        <div className="container flex h-9 items-center justify-between text-xs">
          <span className="font-mono uppercase tracking-wider text-signal">
            B2B-поставки электротехники · {siteConfig.contacts.city}
          </span>
          <div className="flex items-center gap-5">
            <span className="text-primary-foreground/70">{siteConfig.contacts.workingHours}</span>
            <a
              href={`tel:${siteConfig.contacts.phone.replace(/[\s()-]/g, "")}`}
              className="inline-flex items-center gap-1.5 font-medium hover:text-signal"
            >
              <Phone className="size-3.5" />
              {siteConfig.contacts.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container flex h-16 items-center gap-4">
        <Logo />

        <nav aria-label="Основная навигация" className="ml-4 hidden items-center gap-1 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-steel-600 transition-colors hover:bg-secondary hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden max-w-xs flex-1 lg:block">
          <SearchBar />
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex lg:ml-3">
          <CompareBadge />
          <FavoritesBadge />
          <CartBadge />
          <AccountLink />
          <QuoteDialog />
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
