export const dynamic = "force-dynamic";

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { CatalogView } from "@/components/catalog/catalog-view";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { catalogService } from "@/server/services";

export const metadata: Metadata = {
  title: "Каталог электротехнической продукции",
  description:
    "Кабели, провода, изоляторы, арматура СИП, муфты, автоматы и высоковольтное оборудование. Фильтры по производителю, материалу, сечению и напряжению, цены и наличие.",
  alternates: { canonical: "/catalog" },
  openGraph: {
    title: "Каталог электротехнической продукции",
    description:
      "Кабели, провода, изоляторы, арматура СИП, муфты, автоматы и высоковольтное оборудование для бизнеса и промышленности Казахстана.",
    url: "/catalog",
    type: "website",
  },
};

export default async function CatalogPage() {
  const [products, categoryNames, total] = await Promise.all([
    catalogService.loadProducts(),
    catalogService.getCategoryNames(),
    catalogService.count(),
  ]);

  return (
    <div className="bg-secondary/20">
      {/* Page header */}
      <div className="border-b border-border bg-background">
        <div className="container py-8">
          <nav
            aria-label="Навигационная цепочка"
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-primary">
              Главная
            </Link>
            <ChevronRight className="size-4" />
            <span className="font-medium text-primary">Каталог</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Каталог продукции
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {total} позиций для энергетики, строительства и
                промышленности. Фильтруйте по параметрам и запрашивайте КП в один
                клик.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog body */}
      <div className="container py-8">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogView products={products} categoryNames={categoryNames} />
        </Suspense>
      </div>
    </div>
  );
}
