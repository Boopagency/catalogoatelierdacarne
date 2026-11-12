"use client";

import type { OrderItem } from "./types";

export type LocalOrder = {
  code: string;
  number: number | null;
  message: string;
  whatsapp: string;
  total: number;
  fulfillment: "retirada" | "entrega";
  lines: OrderItem[];
  created_at: string;
};

const KEY = "atelier-pedidos";

export function saveLocalOrder(o: LocalOrder) {
  try {
    const all = listLocalOrders().filter((x) => x.code !== o.code);
    localStorage.setItem(KEY, JSON.stringify([o, ...all].slice(0, 20)));
  } catch {
    /* armazenamento indisponível */
  }
}

export function listLocalOrders(): LocalOrder[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export const getLocalOrder = (code: string) => listLocalOrders().find((o) => o.code === code.toUpperCase());
