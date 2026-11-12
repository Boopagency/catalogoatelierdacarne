"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Animal } from "./anatomy";
import { QTY_MIN, roundQty } from "./format";
import type { Unit } from "./types";

export type CartLine = {
  key: string; // `${type}:${id}`
  type: "product" | "kit";
  id: string;
  name: string;
  unit: Unit | "kit";
  price: number;
  qty: number;
  notes: string;
  image?: string | null;
  animal?: Animal | null;
  regions?: string[];
};

export type CheckoutInfo = {
  name: string;
  phone: string;
  fulfillment: "retirada" | "entrega";
  address: string;
  neighborhood: string;
  when: string;
  payment: string;
  notes: string;
};

type CartState = {
  lines: CartLine[];
  open: boolean;
  checkout: CheckoutInfo;
  add: (line: Omit<CartLine, "key" | "notes"> & { notes?: string }) => void;
  setQty: (key: string, qty: number) => void;
  setNotes: (key: string, notes: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  setCheckout: (patch: Partial<CheckoutInfo>) => void;
  sync: (fresh: Map<string, { price: number; available: boolean; name: string }>) => string[];
};

const emptyCheckout: CheckoutInfo = {
  name: "",
  phone: "",
  fulfillment: "retirada",
  address: "",
  neighborhood: "",
  when: "",
  payment: "Pix",
  notes: "",
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      checkout: emptyCheckout,
      add: (line) => {
        const key = `${line.type}:${line.id}`;
        const existing = get().lines.find((l) => l.key === key);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.key === key
                ? { ...l, qty: l.unit === "kg" ? roundQty(l.qty + line.qty, "kg") : l.qty + line.qty, notes: line.notes || l.notes }
                : l
            ),
          });
        } else {
          set({ lines: [...get().lines, { ...line, key, notes: line.notes ?? "" }] });
        }
      },
      setQty: (key, qty) =>
        set({
          lines: get()
            .lines.map((l) => {
              if (l.key !== key) return l;
              const min = l.unit === "kit" ? 1 : QTY_MIN[l.unit];
              return { ...l, qty: qty < min ? 0 : l.unit === "kg" ? roundQty(qty, "kg") : Math.round(qty) };
            })
            .filter((l) => l.qty > 0),
        }),
      setNotes: (key, notes) => set({ lines: get().lines.map((l) => (l.key === key ? { ...l, notes } : l)) }),
      remove: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
      setCheckout: (patch) => set({ checkout: { ...get().checkout, ...patch } }),
      sync: (fresh) => {
        const removed: string[] = [];
        const lines = get()
          .lines.map((l) => {
            const f = fresh.get(l.key);
            if (!f || !f.available) {
              removed.push(l.name);
              return null;
            }
            return { ...l, price: f.price, name: f.name };
          })
          .filter(Boolean) as CartLine[];
        set({ lines });
        return removed;
      },
    }),
    {
      name: "atelier-carrinho",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, checkout: s.checkout }),
    }
  )
);

/** Total em centavos, arredondado como no banco (round half up). */
export const money = (price: number, qty: number) => Math.round(Math.round(price * 100) * qty) / 100;
export const lineTotal = (l: CartLine) => money(l.price, l.qty);
export const cartTotal = (lines: CartLine[]) => Math.round(lines.reduce((s, l) => s + Math.round(lineTotal(l) * 100), 0)) / 100;
