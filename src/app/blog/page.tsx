import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { articles } from "@/config/articles";
import { blogTopics } from "@/config/blog-topics";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "Выбор кабеля, оборудования и электромонтажа — блог AIMAG",
  description:
    "Руководства по закупке СИП, ВВГнг, промышленных кабелей, муфт, изоляторов, трансформаторов и КТП. Подготовка заявки на поставку и электромонтаж в Казахстане.",
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

      <nav aria-label="Темы блога" className="mt-8 flex flex-wrap gap-3">
        {blogTopics.map((topic) => (
          <a
            key={topic.id}
            href={`#${topic.id}`}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:border-signal"
          >
            {topic.title}
          </a>
        ))}
      </nav>
      {blogTopics.map((topic) => (
        <section
          key={topic.id}
          id={topic.id}
          className="mt-10 scroll-mt-28"
          aria-labelledby={`${topic.id}-title`}
        >
          <h2 id={`${topic.id}-title`} className="font-display text-2xl font-semibold text-primary">
            {topic.title}
          </h2>
          <p className="mt-2 text-muted-foreground">{topic.description}</p>
          <Link
            href={topic.catalog.href}
            className="mt-3 inline-block text-sm font-semibold text-signal-700 underline"
          >
            {topic.catalog.label}
          </Link>
          <div className="mt-5 grid gap-6 md:grid-cols-3">
            {articles
              .filter((article) => topic.slugs.includes(article.slug))
              .map((article) => (
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
                  <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-primary transition-colors group-hover:text-signal-700">
                    {article.title}
                  </h3>
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
        </section>
      ))}
    </div>
  );
}
