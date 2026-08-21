"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Package, FolderTree, Tag, Building2, FileText } from "lucide-react";

import { globalAdminSearch, type GlobalSearchResult } from "@/server/actions/admin";

const TYPE_ICON: Record<GlobalSearchResult["type"], typeof Search> = {
  product: Package,
  category: FolderTree,
  brand: Tag,
  customer: Building2,
  quote: FileText,
};

const TYPE_LABEL: Record<GlobalSearchResult["type"], string> = {
  product: "Товар",
  category: "Категория",
  brand: "Производитель",
  customer: "Клиент",
  quote: "Заявка",
};

export function AdminGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearchResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const result = await globalAdminSearch(query);
      setResults(result.ok ? (result.data ?? []) : []);
      setLoading(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goTo(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        placeholder="Поиск: товары, клиенты, заявки…"
        className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-8 text-sm shadow-sm focus-visible:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-96 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {loading ? "Поиск…" : "Ничего не найдено."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((r) => {
                const Icon = TYPE_ICON[r.type];
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => goTo(r.href)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary/60"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-primary">{r.title}</span>
                        {r.subtitle && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {r.subtitle}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {TYPE_LABEL[r.type]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
