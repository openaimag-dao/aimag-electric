"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  onSubmitted?: () => void;
}

export function SearchBar({ className, onSubmitted }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/catalog?q=${encodeURIComponent(q)}`);
    onSubmitted?.();
  }

  return (
    <form
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
        placeholder="Поиск: ВВГ, СИП, изоляторы…"
        aria-label="Поиск по каталогу"
        className="h-10 w-full rounded-md border border-input bg-secondary/60 pl-9 pr-3 text-sm text-primary shadow-sm placeholder:text-muted-foreground focus-visible:border-signal focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  );
}
