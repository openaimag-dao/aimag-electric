import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { ContentBlocks } from "@/components/common/content-blocks";
import { articles } from "@/config/articles";
import { buyingGuides } from "@/config/buying-guides";
import { siteConfig } from "@/config/site";
import { articleQuote } from "@/config/article-quote";

const relatedCatalog: Record<string, { href: string; label: string }> = {
  "kak-vybrat-sechenie-kabelya": {
    href: "/catalog?cat=kabel-provod",
    label: "Посмотреть кабели и провода",
  },
  "zakupki-samruk-kazyna": {
    href: "/quick-order",
    label: "Подобрать товары по списку артикулов",
  },
  "uzo-vs-difavtomat": {
    href: "/catalog?cat=avtomaty",
    label: "Посмотреть защитные аппараты",
  },
  "avtomaticheskie-vyklyuchateli-b-c-d": {
    href: "/catalog?cat=avtomaty",
    label: "Посмотреть автоматические выключатели",
  },
  "khranenie-i-uchet-kabelnoy-produktsii": {
    href: "/catalog?cat=kabel-provod",
    label: "Посмотреть кабели и провода",
  },
  "gofra-metallorukav-kabel-kanal": {
    href: "/catalog?q=%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB",
    label: "Найти кабель-каналы в каталоге",
  },
  "izolyatory-vl-shtyrevye-i-podvesnye": {
    href: "/catalog?cat=izolyatory-armatura",
    label: "Посмотреть изоляторы и арматуру ВЛ",
  },
  "kabelnye-mufty-kak-vybrat": {
    href: "/catalog?cat=kabelnaya-armatura",
    label: "Посмотреть кабельную арматуру и муфты",
  },
  "vvg-vs-vvgng-ls": {
    href: "/kabeli-vvg-avvg",
    label: "Посмотреть кабель ВВГ и АВВГ",
  },
  "sip-vs-golyj-provod": {
    href: "/kabeli-sip",
    label: "Посмотреть провод СИП",
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

function findArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `${siteConfig.url}/blog/${article.slug}`,
      type: "article",
      publishedTime: article.date,
    },
    twitter: { card: "summary", title: article.title, description: article.excerpt },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  const related = article.catalogLink ?? relatedCatalog[article.slug];
  const others = articles
    .filter((a) => a.slug !== article.slug)
    .sort((a, b) => {
      const score = (candidate: (typeof articles)[number]) =>
        (related && (candidate.catalogLink ?? relatedCatalog[candidate.slug])?.href === related.href
          ? 2
          : 0) + (candidate.category === article.category ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, 2);
  const articleUrl = `${siteConfig.url}/blog/${article.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${articleUrl}#article`,
    url: articleUrl,
    mainEntityOfPage: articleUrl,
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    inLanguage: "ru",
    articleSection: article.category,
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <div className="container max-w-3xl py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Все статьи
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <Badge variant="muted">{article.category}</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {article.readingTime}
        </span>
        <time className="text-xs text-muted-foreground" dateTime={article.date}>
          {formatDate(article.date)}
        </time>
      </div>

      <h1 className="mt-3 font-display text-3xl font-bold text-primary md:text-4xl">
        {article.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>

      <div className="mt-8 border-t border-border pt-2">
        <ContentBlocks blocks={article.content} />
      </div>

      {buyingGuides.some((guide) => guide.slug === article.slug) && (
        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-primary">
            Материалы и монтаж для одного объекта
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Соберите кабель, оборудование и работы в одну заявку с понятным составом поставки.
          </p>
          <Link
            href="/blog/komplektaciya-obekta-elektromontazh-pod-klyuch"
            className="mt-3 inline-block text-sm font-semibold text-signal-700 underline-offset-2 hover:underline"
          >
            Как подготовить общий запрос →
          </Link>
        </div>
      )}

      {related && (
        <div className="mt-10 rounded-2xl border border-border bg-secondary/30 p-6">
          <h2 className="font-display text-lg font-semibold text-primary">Следующий шаг</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Перейдите к товарам или обсудите состав поставки и работ для вашего проекта.
          </p>
          <Link
            href={related.href}
            className="mt-3 inline-block text-sm font-semibold text-signal-700 underline-offset-2 hover:underline"
          >
            {related.label} →
          </Link>
        </div>
      )}

      <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display font-semibold text-primary">Нужен подбор под ваш проект?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Укажите данные ниже в заявке — подготовим коммерческое предложение. Если параметр
            неизвестен, напишите, что нужен подбор.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-steel-700">
            {articleQuote(article.slug, article.title).checklist.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
        <QuoteDialog
          triggerLabel="Запросить КП"
          defaultMessage={articleQuote(article.slug, article.title).message}
        />
      </div>

      {others.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-lg font-semibold text-primary">Читайте также</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {others.map((a) => (
              <Link
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-signal/60"
              >
                <Badge variant="muted">{a.category}</Badge>
                <p className="mt-2 font-medium text-primary group-hover:text-signal-700">
                  {a.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
