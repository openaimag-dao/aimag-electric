"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Prominent catalog search used in the hero. Larger and higher-contrast than
 * the header search — this is a primary entry point into the catalog.
 */
export function CatalogSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex items-center gap-2 rounded-xl border border-steel-700 bg-white/95 p-1.5 shadow-2xl shadow-black/20 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/40"
    >
      <Search className="ml-2.5 size-5 shrink-0 text-steel-400" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Найти по каталогу: ВВГ, СИП-2, ВА47, изолятор…"
        aria-label="Поиск по каталогу"
        className="h-10 w-full min-w-0 bg-transparent text-sm text-primary placeholder:text-steel-400 focus:outline-none"
      />
      <Button type="submit" variant="signal" className="shrink-0">
        Найти
      </Button>
    </form>
  );
}
