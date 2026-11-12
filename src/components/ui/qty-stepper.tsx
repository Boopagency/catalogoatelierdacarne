"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { formatQty, QTY_STEP } from "@/lib/format";
import type { Unit } from "@/lib/types";

type Props = {
  qty: number;
  unit: Unit | "kit";
  onChange: (q: number) => void;
  size?: "sm" | "md" | "lg";
  tone?: "red" | "dark";
};

export function QtyStepper({ qty, unit, onChange, size = "md", tone = "dark" }: Props) {
  const step = unit === "kit" ? 1 : QTY_STEP[unit];
  const min = unit === "kg" ? 0.25 : 1;
  const atMin = qty - step < min;
  const h = size === "sm" ? "h-9" : size === "lg" ? "h-13" : "h-11";
  const btn = size === "sm" ? "w-9" : size === "lg" ? "w-13" : "w-11";
  const bg = tone === "red" ? "bg-red text-white" : "bg-surface-3 text-ink border border-line-strong";
  return (
    <div className={`inline-flex items-center rounded-full ${bg} ${h}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(qty - step); }}
        className={`focus-ring grid ${btn} h-full place-items-center rounded-full transition hover:bg-black/15 active:scale-90`}
        aria-label={atMin ? "Remover" : "Diminuir"}
      >
        {atMin ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
      </button>
      <span className={`tabular min-w-[4.2rem] text-center font-semibold ${size === "sm" ? "text-[13px]" : "text-[15px]"}`} aria-live="polite">
        {formatQty(qty, unit)}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(qty + step); }}
        className={`focus-ring grid ${btn} h-full place-items-center rounded-full transition hover:bg-black/15 active:scale-90`}
        aria-label="Aumentar"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
