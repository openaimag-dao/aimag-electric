import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { siteConfig } from "@/config/site";
import { buildFaqJsonLd } from "@/lib/faq-jsonld";
import { ContentBlocks } from "@/components/common/content-blocks";
import { CableCalculator } from "@/components/tools/cable-calculator";
import { QuoteDialog } from "@/components/common/quote-dialog";
import type { ArticleBlock } from "@/config/articles";

const TITLE = "Калькулятор сечения кабеля по нагрузке — расчёт онлайн";
const DESCRIPTION =
  "Рассчитайте сечение кабеля ВВГ или АВВГ по мощности или току нагрузки: однофазная и трёхфазная сеть, медь и алюминий. Ориентировочный расчёт со ссылкой на нужный кабель в каталоге.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kalkulyator-secheniya-kabelya" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}/kalkulyator-secheniya-kabelya`,
    type: "website",
  },
};

const content: ArticleBlock[] = [
  {
    kind: "p",
    text: "Сечение кабеля подбирают по допустимому длительному току для материала жилы и способа прокладки — так, чтобы кабель не перегревался под нагрузкой. Калькулятор выше даёт ориентировочный результат по справочным значениям для прокладки в воздухе (аналог таблиц ПУЭ 1.3.4–1.3.5).",
  },
  { kind: "h2", text: "Что учесть дополнительно" },
  {
    kind: "list",
    items: [
      "Групповая прокладка нескольких кабелей и прокладка в земле или в трубе снижают допустимый ток — для таких условий берут сечение с запасом",
      "На длинных линиях (от 50 м) растёт просадка напряжения — её отдельно проверяют расчётом под конкретную линию",
      "Алюминиевые жилы (АВВГ) при той же нагрузке требуют большего сечения, чем медные (ВВГ)",
      "Сечение кабеля должно быть согласовано с номиналом защитного автомата по схеме",
    ],
  },
  {
    kind: "note",
    text: "Итоговое сечение для проекта должно быть подтверждено расчётом в проектной документации или электромонтажником — калькулятор даёт только предварительную оценку.",
  },
  {
    kind: "links",
    items: [
      {
        href: "/blog/kak-vybrat-sechenie-kabelya",
        label: "Полная методика: расчёт по току, потере напряжения и стойкости к КЗ",
      },
    ],
  },
];

const faq = [
  {
    q: "Калькулятор подходит для проектного расчёта?",
    a: "Нет, это ориентировочный расчёт по справочной таблице допустимого тока. Итоговое сечение для конкретного объекта должно быть подтверждено проектной документацией или электромонтажником с учётом способа прокладки, группировки кабелей и защитных аппаратов.",
  },
  {
    q: "Почему для алюминия (АВВГ) получается большее сечение, чем для меди (ВВГ)?",
    a: "Алюминий хуже проводит ток, чем медь, поэтому при одинаковой нагрузке алюминиевой жиле нужно большее сечение, чтобы не перегреваться.",
  },
  {
    q: "Как сечение из расчёта связано с номиналом автомата?",
    a: "Защитный автомат подбирают так, чтобы он отключал линию раньше, чем кабель начнёт перегреваться при перегрузке — номинал автомата и сечение кабеля для конкретной линии согласуются по схеме проекта, а не только по этому калькулятору.",
  },
];

export default function CableCalculatorPage() {
  const faqLd = buildFaqJsonLd(faq);

  return (
    <div className="bg-secondary/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
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
            <span className="font-medium text-primary">Калькулятор сечения кабеля</span>
          </nav>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Калькулятор сечения кабеля по нагрузке
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{DESCRIPTION}</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-3xl">
          <CableCalculator />

          <div className="mt-10">
            <ContentBlocks blocks={content} />
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-primary">Частые вопросы</h2>
            <div className="mt-4 space-y-4">
              {faq.map((item) => (
                <div key={item.q} className="rounded-lg border border-border p-4">
                  <p className="font-medium text-primary">{item.q}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display font-semibold text-primary">
                Нужен точный расчёт под проект?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Пришлите нагрузку и условия прокладки — подберём кабель и уточним цену и срок
                поставки.
              </p>
            </div>
            <QuoteDialog triggerLabel="Запросить КП" />
          </div>
        </div>
      </div>
    </div>
  );
}
