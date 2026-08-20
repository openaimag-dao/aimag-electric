// Cached like every other DB-backed page here: admin writes call
// revalidatePath("/catalog") (see server/actions/admin/*), so there's no
// need to force a fresh render — and re-render — on every single request.

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { siteConfig } from "@/config/site";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { catalogService } from "@/server/services";

interface PageProps {
  searchParams: Promise<{ cat?: string }>;
}

const DEFAULT_TITLE = "Каталог электротехнической продукции";
const DEFAULT_DESCRIPTION =
  "Кабели, провода, изоляторы, арматура СИП, муфты, автоматы и высоковольтное оборудование. Фильтры по производителю, материалу, сечению и напряжению, цены и наличие.";

/**
 * `?cat=` selects a single category (see sitemap.ts, which emits one URL per
 * category) — give that URL its own title/description/canonical instead of
 * reusing the generic catalog metadata for every category variant.
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { cat } = await searchParams;
  const category = cat ? (await catalogService.loadCategories()).find((c) => c.slug === cat) : null;

  const title = category ? `${category.title} — каталог` : DEFAULT_TITLE;
  const description =
    category?.description ??
    (category
      ? `${category.title}: цены, наличие и характеристики в каталоге AIMAG ELECTRIC.`
      : DEFAULT_DESCRIPTION);
  const canonical = category ? `/catalog?cat=${category.slug}` : "/catalog";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${canonical}`,
      type: "website",
    },
  };
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const { cat } = await searchParams;
  const [products, categories, total] = await Promise.all([
    catalogService.loadProducts(),
    catalogService.loadCategories(),
    catalogService.count(),
  ]);
  const categoryNames = Object.fromEntries(categories.map((c) => [c.slug, c.title]));
  const category = cat ? categories.find((c) => c.slug === cat) : null;

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
            {category ? (
              <>
                <Link href="/catalog" className="hover:text-primary">
                  Каталог
                </Link>
                <ChevronRight className="size-4" />
                <span className="font-medium text-primary">{category.title}</span>
              </>
            ) : (
              <span className="font-medium text-primary">Каталог</span>
            )}
          </nav>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                {category ? category.title : "Каталог продукции"}
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {category?.description ??
                  `${total} позиций для энергетики, строительства и промышленности. Фильтруйте по параметрам и запрашивайте КП в один клик.`}
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
