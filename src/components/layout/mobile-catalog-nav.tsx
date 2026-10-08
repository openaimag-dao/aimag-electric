"use client";

import { useState } from "react";
import { SearchBar } from "@/components/layout/search-bar";
import Link from "next/link";
import { List, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Locale } from "@/i18n/config";

export function MobileCatalogNav({
  categories,
  locale,
}: {
  categories: { slug: string; title: string }[];
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const kk = locale === "kk";
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="min-h-11 shrink-0 justify-start gap-2">
          <List className="size-5" aria-hidden="true" />
          Каталог
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-3">
        <SheetTitle className="pr-8 text-xl font-semibold text-primary">
          {kk ? "Тауар санаттары" : "Категории товаров"}
        </SheetTitle>
        <SheetDescription className="text-sm text-muted-foreground">
          {kk ? "Қажетті бөлімді таңдаңыз" : "Выберите нужный раздел"}
        </SheetDescription>
        <SearchBar onSubmitted={() => setOpen(false)} />
        <nav
          aria-label={kk ? "Тауар санаттары" : "Категории товаров"}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {[{ slug: "", title: kk ? "Барлық тауарлар" : "Все товары" }, ...categories].map(
            (category) => (
              <SheetClose asChild key={category.slug}>
                <Link
                  href={
                    category.slug ? `/catalog?cat=${encodeURIComponent(category.slug)}` : "/catalog"
                  }
                  className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-3 text-sm font-medium text-primary hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                >
                  {category.title}
                  <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                </Link>
              </SheetClose>
            )
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
