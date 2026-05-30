"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// ── External localStorage store ──────────────────────────────────────────────
// useSyncExternalStore is the React 18+ API for external stores. It provides
// a server snapshot (empty) for SSR, eliminating hydration mismatches.

const CART_KEY = "cart";
const listeners = new Set<() => void>();
let cachedCart: CartItem[] | null = null;

function readCart(): CartItem[] {
  if (cachedCart !== null) return cachedCart;
  try {
    const stored = localStorage.getItem(CART_KEY);
    cachedCart = stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    cachedCart = [];
  }
  return cachedCart;
}

function writeCart(cart: CartItem[]) {
  cachedCart = cart;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribeCart(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const serverCart: CartItem[] = [];

// ── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useSyncExternalStore(subscribeCart, readCart, () => serverCart);

  const addToCart = useCallback((newItem: CartItem) => {
    const current = readCart();
    const existing = current.find((item) => item.productId === newItem.productId);
    writeCart(
      existing
        ? current.map((item) =>
            item.productId === newItem.productId
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          )
        : [...current, newItem]
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    writeCart(readCart().filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    writeCart(
      readCart().map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
