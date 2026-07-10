import { SectionHeading } from "@/components/common/section-heading";
import type { BrandDTO } from "@/server/dto";

/**
 * Manufacturer wall. Wordmarks are typeset (not raster logos) to stay crisp
 * and avoid low-quality images while signalling breadth of sourcing.
 */
export function Manufacturers({ brands }: { brands: BrandDTO[] }) {
  return (
    <section className="border-b border-border bg-background py-20 md:py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Производители"
          title="Работаем напрямую с заводами"
          description="Прямые контракты с изготовителями кабеля и электрооборудования из Казахстана, России и Европы — цена и гарантия от первоисточника."
          align="center"
        />

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((m) => (
            <div
              key={m.name}
              className="group flex flex-col items-center justify-center gap-1 bg-card px-4 py-8 text-center transition-colors hover:bg-secondary/60"
            >
              <span className="font-display text-lg font-bold tracking-tight text-steel-600 transition-colors group-hover:text-primary">
                {m.name}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-steel-400">
                {m.origin ?? ""}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          и ещё более 40 брендов — подберём аналог под ваш проект и бюджет.
        </p>
      </div>
    </section>
  );
}
