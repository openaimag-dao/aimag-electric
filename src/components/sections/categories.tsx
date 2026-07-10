import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { resolveCategoryIcon } from "@/lib/category-icons";
import type { CategoryDTO } from "@/server/dto";

/**
 * Large category grid. Data comes from the DB (via the page) as CategoryDTO.
 * The first tile is a full-height feature cell that anchors the section.
 */
export function Categories({ categories }: { categories: CategoryDTO[] }) {
  if (categories.length === 0) return null;
  const [lead, ...rest] = categories;
  const LeadIcon = resolveCategoryIcon(lead.icon);

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

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <Link
            href={`/catalog?cat=${lead.slug}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-steel-950 p-8 text-white lg:row-span-2"
          >
            <div className="absolute inset-0 conductor-grid opacity-40" aria-hidden />
            <div
              className="absolute -right-16 -top-16 size-64 rounded-full bg-signal/20 blur-3xl transition-opacity group-hover:opacity-80"
              aria-hidden
            />
            <div className="relative">
              <span className="inline-flex size-14 items-center justify-center rounded-xl bg-signal text-steel-950">
                <LeadIcon className="size-7" />
              </span>
              {lead.spec && (
                <span className="mt-5 block font-mono text-xs uppercase tracking-widest text-signal">
                  {lead.spec}
                </span>
              )}
              <h3 className="mt-2 font-display text-2xl font-bold">{lead.title}</h3>
              {lead.description && (
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-steel-300">
                  {lead.description}
                </p>
              )}
            </div>
            <span className="relative mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-signal">
              Открыть раздел
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>

          {rest.map((category) => {
            const Icon = resolveCategoryIcon(category.icon);
            return (
              <Link
                key={category.slug}
                href={`/catalog?cat=${category.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-lg"
              >
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-steel-950 text-signal transition-colors group-hover:bg-signal group-hover:text-steel-950">
                  <Icon className="size-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-primary">
                      {category.title}
                    </h3>
                    {category.spec && (
                      <span className="rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-steel-600">
                        {category.spec}
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
