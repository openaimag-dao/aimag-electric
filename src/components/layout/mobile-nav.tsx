"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchBar } from "@/components/layout/search-bar";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { Logo } from "@/components/common/logo";
import { mainNav } from "@/config/navigation";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Открыть меню"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <Logo />
        <SearchBar onSubmitted={() => setOpen(false)} />
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
