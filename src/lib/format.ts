import type { Unit } from "./types";

const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const brl = (n: number) => brlFmt.format(n).replace(/ /g, " ");

const num = (n: number, max = 3) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: max, minimumFractionDigits: 0 }).format(n);

export function formatQty(qty: number, unit: Unit | "kit") {
  if (unit === "kit") return `${qty}x`;
  if (unit === "un") return `${qty} un`;
  if (qty < 1) return `${Math.round(qty * 1000)} g`;
  return `${num(qty)} kg`;
}


export const effectivePrice = (p: { price: number; promo_price: number | null }) =>
  p.promo_price !== null && p.promo_price < p.price ? p.promo_price : p.price;

export const QTY_STEP: Record<Unit, number> = { kg: 0.25, un: 1 };
export const QTY_MIN: Record<Unit, number> = { kg: 0.25, un: 1 };
export const QTY_DEFAULT: Record<Unit, number> = { kg: 1, un: 1 };
export const QTY_PRESETS: Record<Unit, number[]> = { kg: [0.5, 1, 1.5, 2, 3], un: [2, 4, 6, 10, 12] };

export function roundQty(q: number, unit: Unit) {
  const step = QTY_STEP[unit];
  return Math.max(QTY_MIN[unit], Math.round(q / step) * step);
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export function maskPhoneInput(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
