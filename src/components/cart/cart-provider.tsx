"use client";

import * as React from "react";

import type { CartItem } from "@/types/cart";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "aimag-cart-v1";

interface CartContextValue {
  items: CartItem[];
  count: number;
  totalTenge: number;
  hasUnpricedItems: boolean;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  /** Replaces the whole cart wholesale — used to restore a shared cart link. */
  loadItems: (items: CartItem[]) => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Client-side "project cart" — persisted in localStorage, no backend cart
 * table. Items become real QuoteItem rows only once the user submits the
 * cart as a КП request (see /cart and submitQuote).
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    setItems(readStorage());
    hydrated.current = true;
  }, []);

  React.useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = React.useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    track("add_to_cart", { productId: item.productId, sku: item.sku, qty });
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        // Last write wins on every field, not just qty — otherwise the
        // price (and e.g. a company's negotiated price) stays frozen at
        // whatever the first add-to-cart happened to resolve, even if a
        // later add from a page that knows better (e.g. after login)
        // would have quoted the same product differently.
        return prev.map((i) =>
          i.productId === item.productId ? { ...item, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    track("remove_from_cart", { productId });
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQty = React.useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: Math.max(0.001, qty) } : i))
    );
  }, []);

  const clear = React.useCallback(() => setItems([]), []);
  const loadItems = React.useCallback((next: CartItem[]) => setItems(next), []);

  const value = React.useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const totalTenge = items.reduce((sum, i) => sum + (i.priceTenge ?? 0) * i.qty, 0);
    const hasUnpricedItems = items.some((i) => i.priceTenge === null);
    return {
      items,
      count,
      totalTenge,
      hasUnpricedItems,
      addItem,
      removeItem,
      setQty,
      clear,
      loadItems,
    };
  }, [items, addItem, removeItem, setQty, clear, loadItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
