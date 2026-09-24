"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useCatalogFilters } from "@/hooks/use-catalog-filters";
import { filtersToParams } from "@/lib/catalog-url";

/** Build a compact page list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 12. */
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function CatalogPagination({ page, pageCount }: { page: number; pageCount: number }) {
  const { filters } = useCatalogFilters();
  if (pageCount <= 1) return null;

  const hrefFor = (page: number) => {
    const query = filtersToParams({ ...filters, page }).toString();
    return query ? `/catalog?${query}` : "/catalog";
  };

  const pages = pageWindow(page, pageCount);
  const btn =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors";

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Пагинация каталога"
    >
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          prefetch={false}
          rel="prev"
          className={cn(btn, "border-border bg-card text-primary hover:bg-secondary")}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft className="size-4" />
        </Link>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1.5 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            prefetch={false}
            aria-label={`Страница ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              btn,
              p === page
                ? "border-signal bg-signal text-steel-950"
                : "border-border bg-card text-primary hover:bg-secondary"
            )}
          >
            {p}
          </Link>
        )
      )}

      {page < pageCount && (
        <Link
          href={hrefFor(page + 1)}
          prefetch={false}
          rel="next"
          className={cn(btn, "border-border bg-card text-primary hover:bg-secondary")}
          aria-label="Следующая страница"
        >
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
