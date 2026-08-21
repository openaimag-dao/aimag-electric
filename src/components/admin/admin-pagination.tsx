"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

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

/** Generic paginator for admin tables — decoupled from any one filter hook. */
export function AdminPagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const pages = pageWindow(page, pageCount);
  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2.5 text-sm font-medium transition-colors";

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Пагинация">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          btn,
          "border-border bg-card text-primary hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        )}
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1.5 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              btn,
              p === page
                ? "border-signal bg-signal text-steel-950"
                : "border-border bg-card text-primary hover:bg-secondary"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className={cn(
          btn,
          "border-border bg-card text-primary hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        )}
        aria-label="Следующая страница"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
