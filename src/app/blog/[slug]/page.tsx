import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { articles, type ArticleBlock } from "@/config/articles";

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
    title: `${article.title} — AIMAG ELECTRIC`,
    description: article.excerpt,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.kind) {
    case "h2":
      return <h2 className="mt-8 font-display text-xl font-semibold text-primary">{block.text}</h2>;
    case "p":
      return <p className="mt-4 leading-relaxed text-foreground">{block.text}</p>;
    case "list":
      return (
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-foreground">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-secondary/60">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 font-medium text-primary">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "note":
      return (
        <p className="mt-4 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {block.text}
        </p>
      );
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <div className="container max-w-3xl py-12">
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
        {article.content.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display font-semibold text-primary">Нужен подбор под ваш проект?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Пришлите спецификацию — подготовим коммерческое предложение.
          </p>
        </div>
        <QuoteDialog triggerLabel="Запросить КП" />
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
