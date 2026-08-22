"use client";

import * as React from "react";

const STORAGE_KEY = "aimag-favorites-v1";

interface FavoritesContextValue {
  ids: string[];
  count: number;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const FavoritesContext = React.createContext<FavoritesContextValue | null>(null);

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

/**
 * Избранное — только на клиенте (localStorage), без обязательной
 * регистрации. Хранит только id товаров; сами карточки на /favorites
 * подтягиваются свежими с сервера, так что цена/наличие никогда не устаревают.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
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

  const toggle = React.useCallback((productId: string) => {
    setIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [productId, ...prev]
    );
  }, []);

  const remove = React.useCallback((productId: string) => {
    setIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clear = React.useCallback(() => setIds([]), []);

  const value = React.useMemo<FavoritesContextValue>(
    () => ({
      ids,
      count: ids.length,
      has: (productId: string) => ids.includes(productId),
      toggle,
      remove,
      clear,
    }),
    [ids, toggle, remove, clear]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = React.useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
