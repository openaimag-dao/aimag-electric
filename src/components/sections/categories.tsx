import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { resolveCategoryIcon } from "@/lib/category-icons";
import { resolveCategoryIllustration } from "@/components/sections/category-illustrations";
import type { CategoryCardDTO } from "@/server/dto";

/** How many category tiles to show on the homepage — a clean 4×2 grid. */
const TILE_COUNT = 8;

/**
 * Homepage category grid: a hand-drawn pictogram per category (see
 * category-illustrations.tsx) rather than a photo. Tried real product
 * photos first (categoryRepository.findManyWithStats picked the most
 * popular in-stock product's own photo) — repeatedly surfaced other
 * suppliers' watermarks or a stray phone number baked into a hotlinked
 * image. A drawn icon can't carry someone else's branding. Sorted by
 * actual inventory so the categories worth showing off lead — not
 * creation order. Rest of the catalog is one click away via "Весь каталог".
 */
export function Categories({ categories }: { categories: CategoryCardDTO[] }) {
  if (categories.length === 0) return null;

  const tiles = categories
    .slice()
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, TILE_COUNT);

  return (
    <section
      id="categories"
      className="scroll-mt-24 border-b border-border bg-background py-20 md:py-24"
    >
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Каталог"
            title="Направления поставок"
            description="От установочного провода до оборудования подстанций — весь ассортимент для энергетики, строительства и промышленности."
          />
          <Button asChild variant="outline">
            <Link href="/catalog">
              Весь каталог
              <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {tiles.map((category) => (
            <CategoryTile key={category.slug} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ category }: { category: CategoryCardDTO }) {
  const Illustration = resolveCategoryIllustration(category.slug);
  const FallbackIcon = resolveCategoryIcon(category.icon);

  return (
    <Link
      href={`/catalog?cat=${category.slug}`}
      className="group flex flex-col items-center rounded-2xl border border-border bg-card px-4 py-6 text-center transition-all hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-lg"
    >
      <span className="inline-flex size-20 items-center justify-center rounded-full bg-signal/15 text-primary transition-colors group-hover:bg-signal/25">
        {Illustration ? <Illustration className="size-10" /> : <FallbackIcon className="size-9" />}
      </span>

      <h3 className="mt-4 font-display text-sm font-semibold leading-snug text-primary sm:text-base">
        {category.title}
      </h3>
      <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Package className="size-3" />
        {category.productCount} {pluralizeProducts(category.productCount)}
      </span>
    </Link>
  );
}

function pluralizeProducts(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "товара";
  return "товаров";
}
