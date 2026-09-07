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

const TITLE = "Кабель ВВГ и АВВГ — купить с доставкой по Казахстану";
const DESCRIPTION =
  "Силовой кабель ВВГ (медный) и АВВГ (алюминиевый), включая ВВГнг и ВВГнг(А)-LS, сечения от 1,5 до 240 мм². Наличие и цены в Шымкенте, отгрузка отрезками и бухтами, доставка по РК.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kabeli-vvg-avvg" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}/kabeli-vvg-avvg`,
    type: "website",
  },
};

const content: ArticleBlock[] = [
  {
    kind: "p",
    text: "ВВГ и АВВГ — самые массовые марки силового кабеля с ПВХ-изоляцией для стационарной прокладки: в зданиях, на промышленных объектах, при вводе в щиты и подключении оборудования. Разница между ними — в материале жилы, а между модификациями внутри каждой марки — в поведении при пожаре.",
  },
  { kind: "h2", text: "ВВГ или АВВГ: что выбрать" },
  {
    kind: "table",
    headers: ["Параметр", "ВВГ", "АВВГ"],
    rows: [
      ["Материал жилы", "медь", "алюминий"],
      ["Проводимость", "выше", "ниже — требует большего сечения на ту же нагрузку"],
      ["Цена за метр", "выше", "ниже"],
      [
        "Типичное применение",
        "внутренняя проводка, ответственные линии",
        "магистральные и вводные линии, где допустим алюминий по проекту",
      ],
    ],
  },
  { kind: "h2", text: "Модификации по пожаробезопасности" },
  {
    kind: "list",
    items: [
      "ВВГ / АВВГ — базовая ПВХ-изоляция, без нормирования по нераспространению горения",
      "ВВГнг / АВВГнг — оболочка «нг», не распространяет горение при одиночной прокладке",
      "ВВГнг(А)-LS / АВВГнг(А)-LS — низкое дымо- и газовыделение (Low Smoke), для групповой прокладки и путей эвакуации",
    ],
  },
  {
    kind: "note",
    text: "Подробное сравнение с примерами, где по нормам обязателен «нг(А)-LS», — в статье «ВВГ или ВВГнг-LS: в чём разница и когда что применять».",
  },
];

const faq = [
  {
    q: "Какие сечения ВВГ и АВВГ есть в наличии?",
    a: "От 1,5 мм² до 240 мм², число жил от 1 до 5 — по конкретному сечению и марке смотрите наличие в карточке товара или уточняйте у менеджера при запросе КП.",
  },
  {
    q: "Можно ли заказать кабель отрезком, а не полным барабаном?",
    a: "Да, отгружаем и отрезками под проектный расчёт, и полными бухтами/барабанами — способ отгрузки укажите в заявке.",
  },
  {
    q: "В чём разница между ВВГнг и ВВГнг(А)-LS?",
    a: "ВВГнг не распространяет горение при одиночной прокладке; ВВГнг(А)-LS дополнительно нормирован по низкому дымо- и газовыделению — обязателен там, где по проекту требуется групповая прокладка или пути эвакуации. Подробнее — в статье ниже.",
  },
];

export default async function VvgAvvgPage() {
  const products = await catalogService.searchSuggestions("ВВГ", 8);
  const faqLd = buildFaqJsonLd(faq);
  const article = articles.find((a) => a.slug === "vvg-vs-vvgng-ls");

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
            <span className="font-medium text-primary">ВВГ / АВВГ</span>
          </nav>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Кабель ВВГ и АВВГ
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
                href="/catalog?cat=kabel-provod&q=ВВГ"
                className="text-sm font-medium text-signal-700 hover:underline"
              >
                Весь ассортимент ВВГ/АВВГ →
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
            <div className="mt-8">
              <Link href={`/blog/${article.slug}`}>
                <Badge variant="muted" className="cursor-pointer hover:border-signal/60">
                  Статья: {article.title}
                </Badge>
              </Link>
            </div>
          )}

          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display font-semibold text-primary">
                Нужен расчёт кабеля под проект?
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
