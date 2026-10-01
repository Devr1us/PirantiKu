"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  equipmentId: number;
  nama: string;
  slug: string;
  kategoriNama?: string;
  harga_per_hari: number;
  harga_mingguan?: number | null;
  deposit: number;
  foto_url?: string | null;
  qty: number;
  stokTersedia: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (equipmentId: number) => void;
  updateQty: (equipmentId: number, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "pirantiku_cart_v1";

const emptySubscribe = () => () => {};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const isLoaded = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Gagal menyimpan keranjang ke localStorage:", e);
    }
  }, [items, isLoaded]);

  const addItem = (item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.equipmentId === item.equipmentId);
      if (existing) {
        const newQty = Math.min(item.stokTersedia, existing.qty + qty);
        return prev.map((i) =>
          i.equipmentId === item.equipmentId ? { ...i, qty: newQty } : i
        );
      }
      return [...prev, { ...item, qty: Math.min(item.stokTersedia, Math.max(1, qty)) }];
    });
  };

  const removeItem = (equipmentId: number) => {
    setItems((prev) => prev.filter((i) => i.equipmentId !== equipmentId));
  };

  const updateQty = (equipmentId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(equipmentId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.equipmentId === equipmentId) {
          const validQty = Math.min(item.stokTersedia, qty);
          return { ...item, qty: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalItems,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
