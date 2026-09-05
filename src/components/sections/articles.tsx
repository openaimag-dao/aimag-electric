import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PostDTO } from "@/server/dto";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Latest articles — positions the company as an engineering authority. Hidden entirely until there's something real to show. */
export function Articles({ posts }: { posts: PostDTO[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="border-b border-border bg-background py-20 md:py-24">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Блог"
            title="Экспертиза и разборы"
            description="Практические материалы для инженеров, снабженцев и энергетиков."
          />
          <Button asChild variant="outline">
            <Link href="/blog">
              Все статьи
              <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Badge variant="muted">{post.category}</Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {post.readingTime}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-primary transition-colors group-hover:text-signal-700">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <time className="text-xs text-muted-foreground" dateTime={post.publishedAt}>
                  {formatDate(post.publishedAt)}
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
    </section>
  );
}
