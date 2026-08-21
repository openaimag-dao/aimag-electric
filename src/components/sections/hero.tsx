import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { CatalogSearch } from "@/components/sections/catalog-search";
import { getHeroStats } from "@/config/stats";
import type { CategoryDTO } from "@/server/dto";

/**
 * Hero — the 5-second thesis. Left: strong claim, catalog search, dual CTA.
 * Right: trust stats panel. Signature: live-conductor routing over a blueprint
 * grid, terminating in animated "current" nodes.
 */
export function Hero({
  categories,
  productCount,
}: {
  categories: CategoryDTO[];
  productCount: number;
}) {
  const heroStats = getHeroStats(productCount);
  return (
    <section className="relative overflow-hidden bg-steel-950 text-white">
      <div className="conductor-grid absolute inset-0 opacity-50" aria-hidden />
      <div
        className="absolute -right-32 -top-24 size-[560px] rounded-full bg-signal/20 blur-[130px]"
        aria-hidden
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 640"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <path
          d="M-20 120 H360 L440 200 H820 L900 120 H1240"
          stroke="hsl(var(--accent))"
          strokeWidth="1.5"
          strokeOpacity="0.45"
          className="conductor-line"
        />
        <path
          d="M-20 520 H240 L320 440 H720 L800 520 H1240"
          stroke="hsl(var(--accent))"
          strokeWidth="1.5"
          strokeOpacity="0.28"
          className="conductor-line"
          style={{ animationDelay: "-0.7s" }}
        />
        <circle cx="360" cy="120" r="4" fill="hsl(var(--accent))" />
        <circle cx="820" cy="200" r="4" fill="hsl(var(--accent))" />
        <circle cx="240" cy="520" r="4" fill="hsl(var(--accent))" />
        <circle cx="720" cy="440" r="4" fill="hsl(var(--accent))" />
      </svg>

      <div className="container relative grid items-center gap-14 py-20 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
        {/* Left column */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider text-signal">
            <ShieldCheck className="size-3.5" />
            Официальный B2B-поставщик · Казахстан
          </span>

          <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Электротехника для промышленных проектов —
            <span className="text-signal"> со склада и с расчётом под задачу</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-steel-300">
            Кабели, провода, изоляторы, СИП, муфты и высоковольтное оборудование от
            заводов-изготовителей. Документы для юрлиц и тендеров, доставка по всему Казахстану.
          </p>

          {/* Catalog search */}
          <div className="mt-8 max-w-xl">
            <CatalogSearch />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-steel-400">
              <span className="text-steel-500">Популярное:</span>
              {categories.slice(0, 4).map((c) => (
                <Link
                  key={c.slug}
                  href={`/catalog/${c.slug}`}
                  className="underline-offset-4 hover:text-signal hover:underline"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <QuoteDialog>
              <Button variant="signal" size="lg">
                <FileText />
                Получить КП за 15 минут
              </Button>
            </QuoteDialog>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-steel-600 bg-transparent text-white hover:bg-steel-800 hover:text-white"
            >
              <Link href="/catalog">
                Перейти в каталог
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right column — trust stats */}
        <div className="relative rounded-2xl border border-steel-800 bg-steel-900/60 p-2 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-steel-800">
            {heroStats.map((stat) => (
              <div key={stat.label} className="bg-steel-950 p-6">
                <div className="font-display text-3xl font-bold text-signal sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1.5 text-sm leading-snug text-steel-400">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="px-4 py-3 text-center font-mono text-[11px] uppercase tracking-wider text-steel-500">
            Работаем с ТОО, ИП и квазигосударственным сектором
          </p>
        </div>
      </div>
    </section>
  );
}
