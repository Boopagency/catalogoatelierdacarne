"use client";

import { toast } from "sonner";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { useCart } from "@/lib/cart";
import type { Kit } from "@/lib/types";
import { Price } from "./price";

export function KitCard({ kit, index }: { kit: Kit; index: number }) {
  const key = `kit:${kit.id}`;
  const line = useCart((s) => s.lines.find((l) => l.key === key));
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);

  return (
    <article className="flex w-[84vw] max-w-[380px] shrink-0 snap-start flex-col bg-bg md:w-auto md:max-w-none">
      <div className="frame relative aspect-[5/4] overflow-hidden bg-surface">
        {kit.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={kit.image_url} alt="" loading="lazy" className="poster-img absolute inset-0 size-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <span className="sign absolute left-7 top-7 text-[13px] font-bold text-white/80">Kit {String(index + 1).padStart(2, "0")}</span>
        {kit.badge && <span className="sign absolute right-7 top-7 bg-red px-2 py-1 text-[12px] font-bold text-white">{kit.badge}</span>}
        <div className="absolute inset-x-7 bottom-6">
          <h3 className="sign text-[40px] font-black leading-[0.86] text-white">{kit.name}</h3>
          {kit.tagline && <p className="mt-2 text-[14px] italic text-ink-2">{kit.tagline}</p>}
        </div>
      </div>
      <ul className="flex-1 border-x border-line px-6 py-2">
        {kit.items.map((it) => (
          <li key={it} className="border-b border-line py-2.5 text-[14px] leading-snug text-ink-2 last:border-0">
            {it}
          </li>
        ))}
      </ul>
      {kit.note && <p className="border-x border-t border-line px-6 py-2.5 text-[13px] italic text-tan">{kit.note}</p>}
      <div className="flex items-end justify-between gap-3 border border-line px-6 py-5">
        <Price value={kit.price} was={kit.old_price} size="lg" />
        {!kit.available ? (
          <span className="sign text-sm font-bold text-muted">Indisponível</span>
        ) : line ? (
          <QtyStepper qty={line.qty} unit="kit" onChange={(q) => setQty(key, q)} tone="red" />
        ) : (
          <button
            onClick={() => {
              add({ type: "kit", id: kit.id, name: kit.name, unit: "kit", price: kit.price, qty: 1, image: kit.image_url });
              toast(`${kit.name} no pedido`);
            }}
            className="sign focus-ring h-11 border border-ink px-5 text-[16px] font-bold text-ink transition hover:border-red hover:bg-red"
          >
            Adicionar
          </button>
        )}
      </div>
    </article>
  );
}
