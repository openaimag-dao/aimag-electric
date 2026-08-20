"use client";

import * as React from "react";

import type { CartItem } from "@/types/cart";

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
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) => (i.productId === item.productId ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQty = React.useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: Math.max(0.001, qty) } : i))
    );
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  const value = React.useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const totalTenge = items.reduce((sum, i) => sum + (i.priceTenge ?? 0) * i.qty, 0);
    const hasUnpricedItems = items.some((i) => i.priceTenge === null);
    return { items, count, totalTenge, hasUnpricedItems, addItem, removeItem, setQty, clear };
  }, [items, addItem, removeItem, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
