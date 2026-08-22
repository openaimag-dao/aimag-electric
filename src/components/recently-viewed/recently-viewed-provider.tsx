"use client";

import * as React from "react";

const STORAGE_KEY = "aimag-recently-viewed-v1";

/** Reasonable cap — this is a convenience trail, not a full history. */
export const MAX_RECENTLY_VIEWED = 12;

interface RecentlyViewedContextValue {
  ids: string[];
  /** Moves productId to the front, dedupes, trims to MAX_RECENTLY_VIEWED. */
  record: (productId: string) => void;
  clear: () => void;
}

const RecentlyViewedContext = React.createContext<RecentlyViewedContextValue | null>(null);

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Недавно просмотренные товары — только на клиенте (localStorage), без входа в аккаунт. */
export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = React.useState<string[]>([]);
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    setIds(readStorage());
    hydrated.current = true;
  }, []);

  React.useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const record = React.useCallback((productId: string) => {
    setIds((prev) =>
      [productId, ...prev.filter((id) => id !== productId)].slice(0, MAX_RECENTLY_VIEWED)
    );
  }, []);

  const clear = React.useCallback(() => setIds([]), []);

  const value = React.useMemo<RecentlyViewedContextValue>(
    () => ({ ids, record, clear }),
    [ids, record, clear]
  );

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const ctx = React.useContext(RecentlyViewedContext);
  if (!ctx) throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  return ctx;
}
