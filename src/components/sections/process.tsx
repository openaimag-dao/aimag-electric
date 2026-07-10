import { SectionHeading } from "@/components/common/section-heading";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { processSteps } from "@/config/process";

/**
 * How we work — a genuine sequence, so numbered markers are justified here
 * (unlike decorative numbering elsewhere). A connecting rail ties the steps.
 */
export function Process() {
  return (
    <section className="border-b border-border bg-background py-20 md:py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Как мы работаем"
          title="От заявки до отгрузки — прозрачно"
          description="Понятный процесс с реальными сроками на каждом шаге. КП готовим за 15 минут."
        />

        <div className="relative mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Connecting rail (desktop) */}
          <div
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-border via-signal/40 to-border lg:block"
            aria-hidden
          />

          {processSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative">
                <div className="flex items-center gap-4">
                  <span className="relative z-10 inline-flex size-14 items-center justify-center rounded-xl border border-border bg-card text-signal-700 shadow-sm">
                    <Icon className="size-6" />
                  </span>
                  <span className="font-display text-4xl font-bold text-secondary">
                    {String(step.step).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-mono text-xs font-medium text-steel-600">
                  <span className="size-1.5 rounded-full bg-signal" />
                  {step.duration}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <QuoteDialog size="lg" triggerLabel="Начать — отправить заявку" />
        </div>
      </div>
    </section>
  );
}
