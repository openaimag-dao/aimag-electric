"use client";

import * as React from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { searchSuggestions, type SearchSuggestion } from "@/server/actions/search-actions";
import { addProjectItem } from "@/server/actions/project-actions";
import { formatTenge } from "@/lib/money";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

/** Adds a real catalog product (with its live price) to the project — never a free-typed price. */
export function AddProjectItem({ projectId }: { projectId: string }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [adding, setAdding] = React.useState<string | null>(null);

  const rootRef = React.useRef<HTMLDivElement>(null);
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
      if (requestId !== requestIdRef.current) return;
      setResults(found);
      setLoading(false);
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

  async function handlePick(r: SearchSuggestion) {
    setAdding(r.id);
    const result = await addProjectItem(projectId, {
      productId: r.id,
      slug: r.slug,
      sku: r.sku,
      title: r.title,
      qty: 1,
      unit: r.unit,
      priceTenge: r.price,
    });
    setAdding(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось добавить товар");
      return;
    }
    toast.success(`${r.title} — добавлено`);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Найти товар в каталоге и добавить в проект…"
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-md border border-input bg-card shadow-lg">
          {results.length > 0
            ? results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handlePick(r)}
                  disabled={adding === r.id}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-input/60 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-secondary/60"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-primary">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.category} · арт. {r.sku}
                    </div>
                  </div>
                  <div className="shrink-0 whitespace-nowrap text-xs font-medium text-primary">
                    {r.price !== null ? formatTenge(r.price) : "по запросу"}
                  </div>
                  {adding === r.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  ) : (
                    <Plus className="size-4 shrink-0 text-signal-700" />
                  )}
                </button>
              ))
            : !loading && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Ничего не найдено по «{query.trim()}»
                </div>
              )}
        </div>
      )}
    </div>
  );
}
