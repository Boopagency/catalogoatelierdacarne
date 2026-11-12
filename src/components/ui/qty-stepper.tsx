"use client";

import { Minus, Plus, X } from "lucide-react";
import { formatQty, QTY_STEP } from "@/lib/format";
import type { Unit } from "@/lib/types";

type Props = {
  qty: number;
  unit: Unit | "kit";
  onChange: (q: number) => void;
  size?: "sm" | "md" | "lg";
  tone?: "red" | "dark";
};

/** Seletor em caixas, como uma etiqueta de balança: [ − | 1 KG | + ] */
export function QtyStepper({ qty, unit, onChange, size = "md", tone = "dark" }: Props) {
  const step = unit === "kit" ? 1 : QTY_STEP[unit];
  const min = unit === "kg" ? 0.25 : 1;
  const atMin = qty - step < min;
  const h = size === "sm" ? "h-9" : size === "lg" ? "h-12" : "h-11";
  const w = size === "sm" ? "w-9" : size === "lg" ? "w-12" : "w-11";
  const box = tone === "red" ? "border-red bg-red text-white" : "border-line-strong bg-transparent text-ink";
  const div = tone === "red" ? "border-white/30" : "border-line-strong";
  return (
    <div className={`inline-flex items-stretch border ${box} ${h}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(qty - step);
        }}
        className={`focus-ring grid ${w} place-items-center transition hover:bg-black/20`}
        aria-label={atMin ? "Remover" : "Diminuir"}
      >
        {atMin ? <X className="size-3.5" /> : <Minus className="size-3.5" />}
      </button>
      <span
        className={`sign tabular grid min-w-[4.6rem] place-items-center border-x px-1 font-bold ${div} ${size === "sm" ? "text-[15px]" : "text-[17px]"}`}
        aria-live="polite"
      >
        {formatQty(qty, unit)}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(qty + step);
        }}
        className={`focus-ring grid ${w} place-items-center transition hover:bg-black/20`}
        aria-label="Aumentar"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
