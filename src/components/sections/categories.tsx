import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Package } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { resolveCategoryIcon } from "@/lib/category-icons";
import type { CategoryCardDTO } from "@/server/dto";

/** How many category tiles to show on the homepage — a clean 4×2 grid. */
const TILE_COUNT = 8;

/**
 * Homepage category grid: uniform photo tiles (real product photos, see
 * categoryRepository.findManyWithStats), sorted by actual inventory so the
 * categories worth showing off lead — not creation order. Rest of the
 * catalog is one click away via "Весь каталог".
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
          {tiles.map((category, i) => (
            <CategoryTile key={category.slug} category={category} priority={i < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ category, priority }: { category: CategoryCardDTO; priority: boolean }) {
  const Icon = resolveCategoryIcon(category.icon);

  return (
    <Link
      href={`/catalog?cat=${category.slug}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-steel-950 transition-all hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-lg sm:aspect-square"
    >
      {category.image ? (
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
      ) : (
        <div className="conductor-grid absolute inset-0 opacity-30" aria-hidden />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-steel-950 via-steel-950/60 to-transparent"
        aria-hidden
      />

      <span className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm">
        <Icon className="size-4" />
      </span>

      <div className="relative p-4">
        <h3 className="font-display text-sm font-semibold leading-snug text-white sm:text-base">
          {category.title}
        </h3>
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-steel-300">
          <Package className="size-3" />
          {category.productCount} {pluralizeProducts(category.productCount)}
        </span>
      </div>
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
