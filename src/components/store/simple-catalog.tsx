"use client";
import { useState } from "react";
import { brl } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

type Item = { id: string; name: string; price: number; unit: string };

const step = (u: string) => (u === "kg" ? 0.5 : 1);
const qtyText = (q: number, u: string) =>
  u === "kg" ? `${q.toLocaleString("pt-BR")} kg` : `${q} ${u === "kit" ? "kit" : "un"}`;

export function SimpleCatalog(props: { storeName: string; whatsapp: string; sections: { name: string; items: Item[] }[] }) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const all = props.sections.flatMap((s) => s.items);
  const chosen = all.filter((i) => qty[i.id] > 0);
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
    <main className="mx-auto max-w-2xl bg-white px-4 pb-40 pt-6 text-[20px] text-black">
      <h1 className="text-center text-3xl font-bold">{props.storeName}</h1>
      <p className="mt-2 text-center">Toque em <b>+</b> para adicionar. Depois envie pelo WhatsApp.</p>

      {props.sections.map((s) => (
        <section key={s.name} className="mt-8">
          <h2 className="border-b-4 border-black pb-1 text-2xl font-bold">{s.name}</h2>
          <ul>
            {s.items.map((i) => {
              const q = qty[i.id] ?? 0;
              return (
                <li key={i.id} className="flex items-center gap-3 border-b border-neutral-300 py-3">
                  <div className="flex-1">
                    <div className="font-semibold">{i.name}</div>
                    <div>
                      {brl(i.price)}
                      {i.unit === "kg" ? " o kg" : i.unit === "un" ? " a unidade" : ""}
                    </div>
                  </div>
                  {q > 0 && (
                    <>
                      <button aria-label={`Tirar ${i.name}`} onClick={() => change(i, -1)} className="h-12 w-12 rounded-full border-2 border-black text-2xl font-bold">−</button>
                      <span className="min-w-16 text-center font-bold">{qtyText(q, i.unit)}</span>
                    </>
                  )}
                  <button aria-label={`Adicionar ${i.name}`} onClick={() => change(i, 1)} className="h-12 w-12 rounded-full bg-red-700 text-3xl font-bold text-white">+</button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {chosen.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t-2 border-black bg-white p-4">
          <a
            href={waLink(props.whatsapp, message)}
            target="_blank"
            rel="noopener"
            className="mx-auto block max-w-2xl rounded-xl bg-green-700 py-4 text-center text-xl font-bold text-white"
          >
            Enviar pedido pelo WhatsApp ({chosen.length} {chosen.length === 1 ? "item" : "itens"} · {brl(total)})
          </a>
        </div>
      )}
    </main>
  );
}
