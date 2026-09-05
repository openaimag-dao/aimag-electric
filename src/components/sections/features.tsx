import { SectionHeading } from "@/components/common/section-heading";
import { features } from "@/config/features";

/**
 * Advantages. A light, editorial grid — the first tile is emphasized to give
 * the section a focal point rather than a flat list of equal cells.
 */
export function Features() {
  return (
    <section className="border-b border-border bg-secondary/30 py-20 md:py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Почему AIMAG"
          title="Условия для бизнеса и промышленности"
          description="Не просто продаём электротехнику — сопровождаем проект от подбора номенклатуры до отгрузки с документами."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const emphasized = i === 0;
            return (
              <div
                key={feature.title}
                className={[
                  "group relative flex flex-col overflow-hidden rounded-2xl border p-7 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  emphasized
                    ? "border-transparent bg-steel-950 text-white md:row-span-2 md:justify-between"
                    : "border-border bg-card",
                ].join(" ")}
              >
                {emphasized && (
                  <div className="conductor-grid absolute inset-0 opacity-40" aria-hidden />
                )}
                <div className="relative">
                  <span
                    className={[
                      "inline-flex size-12 items-center justify-center rounded-xl transition-colors",
                      emphasized
                        ? "bg-signal text-steel-950"
                        : "bg-steel-950 text-signal group-hover:bg-signal group-hover:text-steel-950",
                    ].join(" ")}
                  >
                    <Icon className="size-6" />
                  </span>
                  <h3
                    className={[
                      "mt-5 font-display font-semibold",
                      emphasized ? "text-xl text-white" : "text-lg text-primary",
                    ].join(" ")}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={[
                      "mt-2 text-sm leading-relaxed",
                      emphasized ? "text-steel-300" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {feature.description}
                  </p>
                </div>
                {emphasized && (
                  <p className="relative mt-8 font-mono text-xs uppercase tracking-wider text-signal">
                    17 регионов · склад в Шымкенте
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
