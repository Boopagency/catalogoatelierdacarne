"use client";

import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import type { Kit } from "@/lib/types";

export function KitCard({ kit }: { kit: Kit }) {
  const key = `kit:${kit.id}`;
  const line = useCart((s) => s.lines.find((l) => l.key === key));
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);

  return (
    <article className={`group relative flex w-[82vw] max-w-[360px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border bg-surface transition md:w-auto md:max-w-none ${line ? "border-red/60" : "border-line hover:border-tan/30"}`}>
      <div className="relative aspect-[16/10] overflow-hidden">
        {kit.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={kit.image_url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
        {kit.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-red px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-lg shadow-black/40">
            {kit.badge}
          </span>
        )}
        <div className="absolute inset-x-5 bottom-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-tan">{kit.tagline}</p>
          <h3 className="font-display mt-1 text-[26px] font-semibold leading-none text-ink">{kit.name}</h3>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5 px-5 pb-4 pt-3">
        {kit.items.map((it) => (
          <li key={it} className="flex gap-2.5 text-[13.5px] leading-snug text-ink-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-red-bright" strokeWidth={3} />
            {it}
          </li>
        ))}
        {kit.note && <li className="pt-1 text-xs italic text-muted">{kit.note}</li>}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
        <div className="leading-none">
          {kit.old_price && <span className="tabular mb-1 block text-xs text-muted line-through">{brl(kit.old_price)}</span>}
          <span className="tabular font-display text-[26px] font-semibold text-ink">{brl(kit.price)}</span>
        </div>
        {!kit.available ? (
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">Indisponível</span>
        ) : line ? (
          <QtyStepper qty={line.qty} unit="kit" onChange={(q) => setQty(key, q)} size="md" tone="red" />
        ) : (
          <button
            onClick={() => {
              add({ type: "kit", id: kit.id, name: kit.name, unit: "kit", price: kit.price, qty: 1, image: kit.image_url });
              toast.success(`${kit.name} adicionado ao pedido`);
            }}
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-bg transition hover:bg-white active:scale-95"
          >
            <Plus className="size-4" /> Adicionar
          </button>
        )}
      </div>
    </article>
  );
}
