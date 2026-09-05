import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { postService } from "@/server/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Блог — AIMAG ELECTRIC",
  description: "Практические материалы для инженеров, снабженцев и энергетиков.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await postService.list();

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
        Блог
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Практические материалы для инженеров, снабженцев и энергетиков.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Статей пока нет — загляните позже.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
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
              <h2 className="mt-4 font-display text-lg font-semibold leading-snug text-primary transition-colors group-hover:text-signal-700">
                {post.title}
              </h2>
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
      )}
    </div>
  );
}
