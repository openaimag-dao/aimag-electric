"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTenge } from "@/lib/money";
import { searchSuggestions, type SearchSuggestion } from "@/server/actions/search-actions";

interface SearchBarProps {
  className?: string;
  onSubmitted?: () => void;
}

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function SearchBar({ className, onSubmitted }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const rootRef = React.useRef<HTMLFormElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      const found = await searchSuggestions(q);
      if (requestId !== requestIdRef.current) return; // a newer keystroke already superseded this request
      setResults(found);
      setLoading(false);
      setActiveIndex(-1);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToCatalog(q: string) {
    router.push(`/catalog?q=${encodeURIComponent(q)}`);
    setOpen(false);
    onSubmitted?.();
  }

  function goToProduct(slug: string) {
    router.push(`/catalog/${slug}`);
    setOpen(false);
    onSubmitted?.();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    goToCatalog(q);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      goToProduct(results[activeIndex].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <form
      ref={rootRef}
      onSubmit={handleSubmit}
      role="search"
      className={cn("relative w-full", className)}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Поиск: ВВГ, СИП, изоляторы…"
        aria-label="Поиск по каталогу"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="search-suggestions"
        aria-autocomplete="list"
        autoComplete="off"
        className="h-10 w-full rounded-md border border-input bg-secondary/60 pl-9 pr-9 text-sm text-primary shadow-sm placeholder:text-muted-foreground focus-visible:border-signal focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {loading && (
        <Loader2
          className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden
        />
      )}

      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-auto rounded-md border border-input bg-card shadow-lg"
        >
          {results.length > 0 ? (
            <>
              {results.map((r, i) => (
                <Link
                  key={r.slug}
                  href={`/catalog/${r.slug}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => {
                    setOpen(false);
                    onSubmitted?.();
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex items-center gap-3 border-b border-input/60 px-3 py-2 text-sm last:border-b-0 hover:bg-secondary/60",
                    i === activeIndex && "bg-secondary/60"
                  )}
                >
                  <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary/40">
                    {r.image ? (
                      <Image
                        src={r.image}
                        alt=""
                        fill
                        className="object-contain p-0.5"
                        sizes="36px"
                      />
                    ) : (
                      <Search className="size-4 text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-primary">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.category} · арт. {r.sku}
                    </div>
                  </div>
                  <div className="shrink-0 whitespace-nowrap text-xs font-medium text-primary">
                    {r.price !== null ? formatTenge(r.price) : "по запросу"}
                  </div>
                </Link>
              ))}
              <button
                type="button"
                onClick={() => goToCatalog(query.trim())}
                className="block w-full px-3 py-2 text-left text-xs font-medium text-signal hover:bg-secondary/60"
              >
                Показать все результаты для «{query.trim()}»
              </button>
            </>
          ) : (
            !loading && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Ничего не найдено по «{query.trim()}»
              </div>
            )
          )}
        </div>
      )}
    </form>
  );
}
