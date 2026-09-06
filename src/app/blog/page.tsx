import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { articles } from "@/config/articles";

export const metadata: Metadata = {
  title: "Блог — AIMAG ELECTRIC",
  description:
    "Практические материалы для инженеров, снабженцев и энергетиков: выбор сечения кабеля, СИП против голого провода, закупки Samruk-Kazyna.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  return (
    <div className="container py-12">
      <div className="max-w-2xl">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-signal-700">
          Блог
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary md:text-4xl">
          Экспертиза и разборы
        </h1>
        <p className="mt-3 text-muted-foreground">
          Практические материалы для инженеров, снабженцев и энергетиков.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Badge variant="muted">{article.category}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {article.readingTime}
              </span>
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold leading-snug text-primary transition-colors group-hover:text-signal-700">
              {article.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <time className="text-xs text-muted-foreground" dateTime={article.date}>
                {formatDate(article.date)}
              </time>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-signal-700">
                Читать
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
