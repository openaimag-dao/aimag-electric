"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Heart, Scale, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchBar } from "@/components/layout/search-bar";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { Logo } from "@/components/common/logo";
import { AccountLink } from "@/components/auth/account-link";
import { useCart } from "@/components/cart/cart-provider";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { useCompare } from "@/components/compare/compare-provider";
import { mainNav } from "@/config/navigation";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const { count: cartCount } = useCart();
  const { count: favoritesCount } = useFavorites();
  const { count: compareCount } = useCompare();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Открыть меню">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <Logo />
        <SearchBar onSubmitted={() => setOpen(false)} />
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <SheetClose asChild>
            <AccountLink />
          </SheetClose>
          <div className="flex items-center gap-1">
            <SheetClose asChild>
              <Link
                href="/compare"
                aria-label={`Сравнение: ${compareCount} товаров`}
                className="relative inline-flex size-9 items-center justify-center rounded-md text-steel-600 hover:bg-secondary hover:text-primary"
              >
                <Scale className="size-5" />
                {compareCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex size-4 items-center justify-center rounded-full bg-signal text-[10px] font-semibold text-steel-950">
                    {compareCount}
                  </span>
                )}
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/favorites"
                aria-label={`Избранное: ${favoritesCount} товаров`}
                className="relative inline-flex size-9 items-center justify-center rounded-md text-steel-600 hover:bg-secondary hover:text-primary"
              >
                <Heart className="size-5" />
                {favoritesCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex size-4 items-center justify-center rounded-full bg-signal text-[10px] font-semibold text-steel-950">
                    {favoritesCount > 9 ? "9+" : favoritesCount}
                  </span>
                )}
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/cart"
                aria-label={`Проект: ${cartCount} позиций`}
                className="relative inline-flex size-9 items-center justify-center rounded-md text-steel-600 hover:bg-secondary hover:text-primary"
              >
                <ShoppingCart className="size-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex size-4 items-center justify-center rounded-full bg-signal text-[10px] font-semibold text-steel-950">
                    {cartCount > 9 ? "9+" : Math.round(cartCount)}
                  </span>
                )}
              </Link>
            </SheetClose>
          </div>
        </div>
        <nav className="flex flex-col">
          {mainNav.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className="border-b border-border py-3 text-base font-medium text-primary transition-colors hover:text-signal-700"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="mt-auto">
          <QuoteDialog className="w-full" size="lg" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
