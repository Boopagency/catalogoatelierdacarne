"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CutDiagram } from "@/components/cut-diagram";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { Sheet } from "@/components/ui/sheet";
import { ANIMAL_LABEL, regionLabel } from "@/lib/anatomy";
import { money, useCart } from "@/lib/cart";
import { brl, effectivePrice, formatQty, QTY_DEFAULT, QTY_MIN, QTY_PRESETS, roundQty } from "@/lib/format";
import type { CategoryWithProducts, Product } from "@/lib/types";
import { Price } from "./price";
import { ProductVisual } from "./product-visual";

type Props = {
  product: Product | null;
  category: CategoryWithProducts | null;
  onClose: () => void;
};

function noteHints(p: Product): string[] {
  if (p.unit === "un") return ["Embalar separado", "Porções de 2 unidades"];
  if (p.animal === "frango") return ["Porções de 500 g", "Sem pele", "Cortar na junta", "Embalar separado"];
  if (!p.animal || p.cut_regions.length === 0) return ["Porções de 500 g", "Embalar separado"];
  return ["Bifes de 1 cm", "Bifes de 2 cm", "Porções de 500 g", "Peça inteira", "Limpar a gordura", "Moer"];
}

function Spec({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <dt className="sign text-[15px] font-bold text-ink">{label}</dt>
      <dd className="sign text-right text-[15px] font-medium text-ink-2">{value}</dd>
    </div>
  );
}

export function ProductSheet({ product, category, onClose }: Props) {
  const key = product ? `product:${product.id}` : "";
  const existing = useCart((s) => s.lines.find((l) => l.key === key));
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const setNotes = useCart((s) => s.setNotes);
  const [qty, setLocalQty] = useState(1);
  const [notes, setLocalNotes] = useState("");
  const [view, setView] = useState<"photo" | "map">("map");

  useEffect(() => {
    if (!product) return;
    setLocalQty(existing?.qty ?? QTY_DEFAULT[product.unit]);
    setLocalNotes(existing?.notes ?? "");
    setView(product.image_url ? "photo" : "map");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const p = product;
  const price = p ? effectivePrice(p) : 0;
  const hasMap = Boolean(p?.animal && p.cut_regions.length);

  const submit = () => {
    if (!p) return;
    if (existing) {
      setQty(key, qty);
      setNotes(key, notes);
      toast("Pedido atualizado");
    } else {
      add({ type: "product", id: p.id, name: p.name, unit: p.unit, price, qty, notes, image: p.image_url, animal: p.animal, regions: p.cut_regions });
      toast(`${p.name} no pedido · ${formatQty(qty, p.unit)}`);
    }
    onClose();
  };

  return (
    <Sheet open={Boolean(p)} onClose={onClose} label={p?.name ?? "Produto"} wide>
      {p && (
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden md:grid md:grid-cols-[1fr_1.25fr_1fr] md:overflow-hidden">
          {/* Coluna 1: nome, texto, preparo (desktop) */}
          <div className="hidden min-w-0 flex-col border-r border-line px-8 py-10 md:flex md:overflow-y-auto">
            <p className="sign text-[14px] font-bold text-tan">{category?.name}</p>
            <h2 className="sign mt-3 text-[52px] font-black leading-[0.86] text-ink">{p.name}</h2>
            <div className="mt-5 h-px w-full bg-line-strong" />
            {p.description ? (
              <p className="mt-5 text-[16px] leading-relaxed text-ink-2">{p.description}</p>
            ) : (
              <p className="mt-5 text-[16px] italic leading-relaxed text-muted">Corte preparado no balcão do Atelier. Peça do jeito que você gosta.</p>
            )}
            {p.prep_tags.length > 0 && (
              <>
                <h3 className="sign mt-10 text-[26px] font-extrabold leading-none text-ink">Como preparar?</h3>
                <div className="mt-4 h-px w-full bg-line-strong" />
                <ul className="mt-2">
                  {p.prep_tags.map((t) => (
                    <li key={t} className="border-b border-line py-2.5 text-[16px] text-ink-2">{t}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Coluna 2: mapa do corte ou foto */}
          <div className="relative min-w-0 border-b border-line md:border-b-0 md:border-r">
            {view === "map" && hasMap ? (
              <div className="relative flex aspect-[5/4] flex-col justify-center px-5 md:h-full md:aspect-auto md:px-10">
                <p className="sign absolute left-5 top-4 text-[14px] font-bold text-muted md:left-8 md:top-8">De onde sai · {ANIMAL_LABEL[p.animal!]}</p>
                <CutDiagram animal={p.animal!} regions={p.cut_regions} className="w-full" title={`Localização do corte ${p.name}`} />
                <p className="sign absolute bottom-4 left-5 flex items-center gap-2 text-[16px] font-bold text-ink md:bottom-8 md:left-8">
                  <span className="size-3 bg-red" />
                  {p.cut_regions.map((r) => regionLabel(p.animal!, r)).join(" + ")}
                </p>
              </div>
            ) : (
              <ProductVisual product={p} fallbackCover={category?.cover_url} className="aspect-[5/4] md:aspect-auto md:h-full" />
            )}
            {p.image_url && hasMap && (
              <div className="absolute left-0 top-0 flex border-b border-r border-line-strong bg-bg">
                {(["photo", "map"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`sign h-10 px-4 text-[14px] font-bold ${view === v ? "bg-ink text-bg" : "text-ink-2"}`}>
                    {v === "photo" ? "Foto" : "Mapa do corte"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coluna 3: ficha e compra */}
          <div className="flex min-w-0 flex-col md:overflow-y-auto">
            <div className="flex-1 px-5 pb-4 pt-6 md:px-8 md:pt-10">
              <div className="md:hidden">
                <p className="sign text-[14px] font-bold text-tan">{category?.name}</p>
                <h2 className="sign mt-2 pr-12 text-[40px] font-black leading-[0.88] text-ink">{p.name}</h2>
                {p.description && <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{p.description}</p>}
              </div>

              <h3 className="sign mt-8 text-[22px] font-extrabold text-ink md:mt-0">Ficha</h3>
              <dl className="mt-2 border-t border-line-strong">
                {p.animal && <Spec label="Animal" value={ANIMAL_LABEL[p.animal]} />}
                {p.animal && p.cut_regions.length > 0 && <Spec label="Região" value={p.cut_regions.map((r) => regionLabel(p.animal!, r).split(" · ")[0]).join(" + ")} />}
                <Spec label="Vendido por" value={p.unit === "kg" ? "Quilo" : "Unidade"} />
                {p.prep_tags.length > 0 && <Spec label="Ideal para" value={p.prep_tags.slice(0, 3).join(", ")} />}
                {p.badge && <Spec label="Selo" value={p.badge} />}
              </dl>

              <div className="mt-6">
                <Price value={price} unit={p.unit} was={price < p.price ? p.price : null} size="xl" muted={!p.available} />
              </div>

              {p.available ? (
                <>
                  <div className="mt-7">
                    <p className="sign text-[15px] font-bold text-ink">Quantidade</p>
                    <div className="mt-2 grid grid-cols-5 border border-line-strong">
                      {QTY_PRESETS[p.unit].map((q, i) => (
                        <button
                          key={q}
                          onClick={() => setLocalQty(q)}
                          className={`sign tabular h-10 text-[15px] font-bold transition ${i > 0 ? "border-l border-line-strong" : ""} ${qty === q ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2"}`}
                        >
                          {formatQty(q, p.unit)}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <QtyStepper qty={qty} unit={p.unit} onChange={(q) => setLocalQty(Math.max(QTY_MIN[p.unit], p.unit === "kg" ? roundQty(q, "kg") : Math.round(q)))} />
                      {p.unit === "kg" && <span className="text-[13px] italic text-muted">de 250 em 250 g</span>}
                    </div>
                  </div>

                  <div className="mt-7">
                    <label htmlFor="obs" className="sign text-[15px] font-bold text-ink">
                      Como você quer? <span className="font-medium text-muted">opcional</span>
                    </label>
                    <textarea
                      id="obs"
                      value={notes}
                      onChange={(e) => setLocalNotes(e.target.value.slice(0, 200))}
                      rows={2}
                      placeholder="Bifes de 2 cm, porções de 500 g..."
                      className="mt-1 w-full resize-none border-b border-line-strong bg-transparent py-2 text-[16px] text-ink placeholder:italic placeholder:text-muted/70 focus:border-tan focus:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {noteHints(p).map((h) => (
                        <button
                          key={h}
                          onClick={() => setLocalNotes((n) => (n.includes(h) ? n : n ? `${n}, ${h.toLowerCase()}` : h))}
                          className="text-[13px] text-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
                        >
                          + {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-6 border-l-2 border-red pl-4 text-[15px] text-ink-2">Esgotou por hoje. Fale com a gente no WhatsApp para encomendar.</p>
              )}
            </div>

            {p.available && (
              <div className="sticky bottom-0 border-t border-line bg-bg px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:px-8">
                <button
                  onClick={submit}
                  className="sign focus-ring flex h-14 w-full items-center justify-between bg-red px-5 text-[18px] font-extrabold text-white transition hover:bg-red-bright"
                >
                  <span>{existing ? "Atualizar pedido" : "Adicionar ao pedido"}</span>
                  <span className="tabular">{brl(money(price, qty))}</span>
                </button>
                {p.unit === "kg" && <p className="mt-2 text-center text-[12px] italic text-muted">Valor estimado. O peso final sai na balança.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
