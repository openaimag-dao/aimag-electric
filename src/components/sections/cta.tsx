import { Phone, Clock, FileText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/common/quote-form";
import { siteConfig } from "@/config/site";

const guarantees = [
  { icon: Clock, text: "КП за 15 минут в рабочее время" },
  { icon: FileText, text: "Полный пакет документов для юрлиц" },
  { icon: ShieldCheck, text: "Сертификаты и паспорта качества" },
];

/**
 * Primary conversion block. Splits a strong promise (left) from an inline
 * quote form (right) so the CTA is actionable without opening a dialog.
 */
export function Cta() {
  const tel = siteConfig.contacts.phone.replace(/[\s()-]/g, "");

  return (
    <section id="quote" className="scroll-mt-24 bg-steel-950 py-20 text-white md:py-24">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider text-signal">
              <Clock className="size-3.5" />
              Быстрый расчёт
            </span>
            <h2 className="mt-6 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Получить коммерческое предложение за 15 минут
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-steel-300">
              Пришлите спецификацию или опишите задачу — инженер подберёт продукцию, проверит
              наличие и подготовит КП с ценами и сроками поставки.
            </p>

            <ul className="mt-8 space-y-3">
              {guarantees.map((g) => {
                const Icon = g.icon;
                return (
                  <li key={g.text} className="flex items-center gap-3 text-steel-200">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-steel-800 text-signal">
                      <Icon className="size-4" />
                    </span>
                    {g.text}
                  </li>
                );
              })}
            </ul>

            <div className="mt-8">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-steel-600 bg-transparent text-white hover:bg-steel-800 hover:text-white"
              >
                <a href={`tel:${tel}`}>
                  <Phone />
                  Позвонить: {siteConfig.contacts.phone}
                </a>
              </Button>
            </div>
          </div>

          {/* Inline form on a light card for contrast */}
          <div className="rounded-2xl border border-steel-800 bg-card p-6 shadow-2xl sm:p-8">
            <h3 className="font-display text-xl font-semibold text-primary">
              Оставить заявку на КП
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ответим в течение рабочего дня, обычно быстрее.
            </p>
            <div className="mt-6">
              <QuoteForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
