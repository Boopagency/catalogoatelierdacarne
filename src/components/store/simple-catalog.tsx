"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { brl } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { Wordmark } from "@/components/ui/logo";
import { WhatsAppIcon } from "@/components/ui/icons";

type Item = { id: string; name: string; price: number; unit: string };
type Section = { name: string; cover: string | null; items: Item[] };

const step = (u: string) => (u === "kg" ? 0.5 : 1);
const qtyText = (q: number, u: string) =>
  u === "kg" ? `${q.toLocaleString("pt-BR")} kg` : `${q} ${u === "kit" ? "kit" : "un"}`;
const unitText = (u: string) => (u === "kg" ? "/kg" : u === "un" ? "/un" : "");

export function SimpleCatalog(props: { storeName: string; whatsapp: string; sections: Section[] }) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const chosen = props.sections.flatMap((s) => s.items).filter((i) => qty[i.id] > 0);
  const total = chosen.reduce((t, i) => t + i.price * qty[i.id], 0);

  const change = (i: Item, dir: 1 | -1) =>
    setQty((q) => ({ ...q, [i.id]: Math.max(0, (q[i.id] ?? 0) + dir * step(i.unit)) }));

  const message = [
    `Olá! Quero fazer um pedido no ${props.storeName}:`,
    "",
    ...chosen.map((i) => `• ${qtyText(qty[i.id], i.unit)} de ${i.name}`),
    "",
    `Total aproximado: ${brl(total)}`,
  ].join("\n");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Wordmark />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-40">
        <p className="sign pt-8 text-[14px] font-semibold text-tan">Catálogo de produtos · Preço do dia</p>
        <p className="mt-2 text-[18px] leading-relaxed text-ink-2">
          Toque em <b className="text-ink">+</b> nos cortes que quiser. No fim, envie o pedido pelo WhatsApp.
        </p>

        {props.sections.map((s) => (
          <section key={s.name} className="mt-10">
            {s.cover ? (
              <div className="relative h-28 overflow-hidden border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.cover} alt="" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 to-black/20" />
                <h2 className="sign absolute bottom-3 left-4 text-[34px] font-black leading-none text-white">{s.name}</h2>
              </div>
            ) : (
              <h2 className="sign border-b border-line-strong pb-2 text-[34px] font-black leading-none">{s.name}</h2>
            )}
            <ul>
              {s.items.map((i) => {
                const q = qty[i.id] ?? 0;
                return (
                  <li key={i.id} className={`flex items-center gap-3 border-b border-line py-4 ${q ? "bg-surface -mx-4 px-4" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <h3 className="sign text-[21px] font-bold leading-tight text-ink">{i.name}</h3>
                      <p className="tabular mt-1 text-[18px] text-ink-2">
                        {brl(i.price)}<span className="text-muted">{unitText(i.unit)}</span>
                      </p>
                    </div>
                    {q > 0 && (
                      <>
                        <button aria-label={`Tirar ${i.name}`} onClick={() => change(i, -1)} className="focus-ring grid size-12 place-items-center border border-line-strong text-ink">
                          <Minus className="size-5" />
                        </button>
                        <span className="sign tabular min-w-14 text-center text-[18px] font-bold">{qtyText(q, i.unit)}</span>
                      </>
                    )}
                    <button aria-label={`Adicionar ${i.name}`} onClick={() => change(i, 1)} className="focus-ring grid size-12 place-items-center bg-red text-white transition active:bg-red-bright">
                      <Plus className="size-6" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      {chosen.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg p-4">
          <a
            href={waLink(props.whatsapp, message)}
            target="_blank"
            rel="noopener"
            className="sign mx-auto flex max-w-3xl items-center justify-center gap-3 bg-red py-4 text-[19px] font-bold text-white transition hover:bg-red-bright"
          >
            <WhatsAppIcon className="size-5" />
            Enviar pedido · {chosen.length} {chosen.length === 1 ? "item" : "itens"} · {brl(total)}
          </a>
        </div>
      )}
    </>
  );
}
