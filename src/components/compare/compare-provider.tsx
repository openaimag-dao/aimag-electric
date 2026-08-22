"use client";

import * as React from "react";

const STORAGE_KEY = "aimag-compare-v1";

/** Comparison only makes sense for a handful of items at once — cap keeps the table readable. */
export const MAX_COMPARE = 4;

type ToggleResult = "added" | "removed" | "full";

interface CompareContextValue {
  ids: string[];
  count: number;
  max: number;
  has: (productId: string) => boolean;
  /** Adds/removes the id; returns "full" (no-op) if already at MAX_COMPARE and trying to add. */
  toggle: (productId: string) => ToggleResult;
  remove: (productId: string) => void;
  clear: () => void;
}

const CompareContext = React.createContext<CompareContextValue | null>(null);

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string").slice(0, MAX_COMPARE)
      : [];
  } catch {
    return [];
  }
}

/** Товары к сравнению — только на клиенте (localStorage), до MAX_COMPARE штук одновременно. */
export function CompareProvider({ children }: { children: React.ReactNode }) {
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

  const toggle = React.useCallback((productId: string): ToggleResult => {
    let result: ToggleResult = "added";
    setIds((prev) => {
      if (prev.includes(productId)) {
        result = "removed";
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= MAX_COMPARE) {
        result = "full";
        return prev;
      }
      result = "added";
      return [...prev, productId];
    });
    return result;
  }, []);

  const remove = React.useCallback((productId: string) => {
    setIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clear = React.useCallback(() => setIds([]), []);

  const value = React.useMemo<CompareContextValue>(
    () => ({
      ids,
      count: ids.length,
      max: MAX_COMPARE,
      has: (productId: string) => ids.includes(productId),
      toggle,
      remove,
      clear,
    }),
    [ids, toggle, remove, clear]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = React.useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
