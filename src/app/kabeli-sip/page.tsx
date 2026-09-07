import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { siteConfig } from "@/config/site";
import { articles } from "@/config/articles";
import { buildFaqJsonLd } from "@/lib/faq-jsonld";
import { catalogService } from "@/server/services";
import { ContentBlocks } from "@/components/common/content-blocks";
import { ProductCard } from "@/components/catalog/product-card";
import { Badge } from "@/components/ui/badge";
import { QuoteDialog } from "@/components/common/quote-dialog";
import type { CatalogProduct } from "@/types/catalog";
import type { ArticleBlock } from "@/config/articles";

const TITLE = "Провод СИП (кабель СИП) — купить в Казахстане";
const DESCRIPTION =
  "Самонесущий изолированный провод СИП-2, СИП-3, СИП-4 для воздушных линий 0,4–20 кВ, а также арматура СИП — анкерные и поддерживающие зажимы, кронштейны. Наличие в Шымкенте, доставка по РК.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kabeli-sip" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}/kabeli-sip`,
    type: "website",
  },
};

const content: ArticleBlock[] = [
  {
    kind: "p",
    text: "СИП (самонесущий изолированный провод) заменил голый алюминиевый провод на большинстве новых и реконструируемых воздушных линий: изоляция жил снижает число аварий от схлёстывания и наброса, упрощает работу под напряжением и допускает меньшие габариты опор.",
  },
  { kind: "h2", text: "Марки СИП" },
  {
    kind: "table",
    headers: ["Марка", "Конструкция", "Применение"],
    rows: [
      [
        "СИП-2",
        "изолированные жилы, изолированная несущая нейтраль",
        "ВЛ 0,4 кВ, ответвления к вводам",
      ],
      ["СИП-3", "одна изолированная жила", "ВЛ 6–20 кВ"],
      [
        "СИП-4",
        "изолированные жилы без несущей нейтрали",
        "ВЛ 0,4 кВ малой протяжённости, ответвления",
      ],
    ],
  },
  { kind: "h2", text: "Арматура для СИП" },
  {
    kind: "list",
    items: [
      "Анкерные зажимы — крепление провода на концевых и угловых опорах",
      "Поддерживающие зажимы — крепление на промежуточных опорах",
      "Прокалывающие зажимы — ответвление без разрезания магистрали",
      "Кронштейны и крюки — монтаж на опоре или стене здания",
    ],
  },
  {
    kind: "note",
    text: "Когда СИП выгоднее голого провода, а когда — нет (с учётом протяжённости линии и стоимости обслуживания), разбираем в статье «СИП или голый провод: что выбрать».",
  },
];

const faq = [
  {
    q: "Чем СИП-2 отличается от СИП-4?",
    a: "СИП-2 несёт изолированную нулевую жилу, которая одновременно служит несущим тросом — используется на протяжённых участках ВЛ 0,4 кВ. СИП-4 не имеет отдельной несущей жилы, все жилы равноправны — применяется на коротких ответвлениях и вводах.",
  },
  {
    q: "Нужна ли отдельная арматура для СИП или подходит обычная линейная?",
    a: "Нужна специализированная арматура СИП — анкерные, поддерживающие и прокалывающие зажимы рассчитаны на изолированный провод и не взаимозаменяемы с арматурой для голого провода.",
  },
  {
    q: "Какие сечения СИП есть в наличии?",
    a: "Ходовые сечения от 16 до 95 мм² по фазным жилам — точное наличие по марке и сечению уточняйте у менеджера при запросе КП.",
  },
];

export default async function SipPage() {
  const products = await catalogService.searchSuggestions("СИП", 8);
  const faqLd = buildFaqJsonLd(faq);
  const article = articles.find((a) => a.slug === "sip-vs-golyj-provod");

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
            <Link href="/catalog?cat=kabel-provod" className="hover:text-primary">
              Кабель и провод
            </Link>
            <ChevronRight className="size-4" />
            <span className="font-medium text-primary">СИП</span>
          </nav>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Провод СИП
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{DESCRIPTION}</p>
        </div>
      </div>

      <div className="container py-8">
        {products.length > 0 && (
          <>
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-primary">В наличии</h2>
              <Link
                href="/catalog?cat=kabel-provod&q=СИП"
                className="text-sm font-medium text-signal-700 hover:underline"
              >
                Весь ассортимент СИП →
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p as CatalogProduct} priority={i === 0} />
              ))}
            </div>
          </>
        )}

        <div className="mt-12 max-w-3xl">
          <ContentBlocks blocks={content} />

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

          {article && (
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href={`/blog/${article.slug}`}>
                <Badge variant="muted" className="cursor-pointer hover:border-signal/60">
                  Статья: {article.title}
                </Badge>
              </Link>
              <Link href="/catalog?cat=armatura-sip">
                <Badge variant="muted" className="cursor-pointer hover:border-signal/60">
                  Арматура СИП
                </Badge>
              </Link>
            </div>
          )}

          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display font-semibold text-primary">
                Нужен расчёт провода под проект?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Пришлите спецификацию — подготовим коммерческое предложение за 15 минут.
              </p>
            </div>
            <QuoteDialog triggerLabel="Запросить КП" />
          </div>
        </div>
      </div>
    </div>
  );
}
