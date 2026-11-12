"use client";

import { useEffect, useState } from "react";
import { Flame, ImageIcon, Map } from "lucide-react";
import { toast } from "sonner";
import { CutDiagram } from "@/components/cut-diagram";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { Sheet } from "@/components/ui/sheet";
import { ANIMAL_LABEL, regionLabel } from "@/lib/anatomy";
import { money, useCart } from "@/lib/cart";
import { brl, effectivePrice, formatQty, QTY_DEFAULT, QTY_MIN, QTY_PRESETS, roundQty, unitSuffix } from "@/lib/format";
import type { CategoryWithProducts, Product } from "@/lib/types";
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
  return ["Bifes de 1 cm", "Bifes de 2 cm", "Porções de 500 g", "Inteira, sem cortar", "Limpar a gordura", "Moer"];
}

export function ProductSheet({ product, category, onClose }: Props) {
  const key = product ? `product:${product.id}` : "";
  const existing = useCart((s) => s.lines.find((l) => l.key === key));
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const setNotes = useCart((s) => s.setNotes);
  const [qty, setLocalQty] = useState(1);
  const [notes, setLocalNotes] = useState("");
  const [view, setView] = useState<"photo" | "map">("photo");

  useEffect(() => {
    if (!product) return;
    setLocalQty(existing?.qty ?? QTY_DEFAULT[product.unit]);
    setLocalNotes(existing?.notes ?? "");
    setView(product.image_url ? "photo" : "map");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const open = Boolean(product);
  const p = product;
  const price = p ? effectivePrice(p) : 0;
  const hasMap = Boolean(p?.animal && p.cut_regions.length);

  const submit = () => {
    if (!p) return;
    if (existing) {
      setQty(key, qty);
      setNotes(key, notes);
      toast.success("Pedido atualizado");
    } else {
      add({ type: "product", id: p.id, name: p.name, unit: p.unit, price, qty, notes, image: p.image_url, animal: p.animal, regions: p.cut_regions });
      toast.success(`${p.name} adicionado`, { description: `${formatQty(qty, p.unit)} · ${brl(money(price, qty))}` });
    }
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} label={p?.name ?? "Produto"} wide>
      {p && (
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto overflow-x-hidden md:grid-cols-[1.1fr_1fr] md:overflow-hidden">
          {/* Visual */}
          <div className="relative min-w-0 border-b border-line md:border-b-0 md:border-r">
            {view === "map" && hasMap ? (
              <div
                className="relative flex aspect-[16/11] flex-col justify-center px-4 md:h-full md:aspect-auto md:px-8"
                style={{ background: "radial-gradient(110% 80% at 50% 45%, #2a211b 0%, #120e0c 75%)" }}
              >
                <p className="absolute left-5 top-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
                  De onde vem · {ANIMAL_LABEL[p.animal!]}
                </p>
                <CutDiagram animal={p.animal!} regions={p.cut_regions} className="w-full" title={`Localização do corte ${p.name}`} />
                <div className="absolute inset-x-5 bottom-5 flex flex-wrap gap-2">
                  {p.cut_regions.map((r) => (
                    <span key={r} className="inline-flex items-center gap-2 rounded-full border border-red/40 bg-red/15 px-3 py-1 text-xs font-medium text-ink">
                      <span className="size-2 rounded-full bg-red-bright shadow-[0_0_10px_2px_rgba(223,59,44,.6)]" />
                      {regionLabel(p.animal!, r)}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <ProductVisual product={p} fallbackCover={category?.cover_url} className="aspect-[16/11] md:aspect-auto md:h-full" />
            )}
            {p.image_url && hasMap && (
              <div className="absolute right-4 top-4 flex rounded-full border border-line-strong bg-black/60 p-1 backdrop-blur md:right-auto md:left-5 md:top-auto md:bottom-5">
                {[
                  { id: "photo" as const, icon: ImageIcon, label: "Foto" },
                  { id: "map" as const, icon: Map, label: "Corte" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setView(t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${view === t.id ? "bg-ink text-bg" : "text-ink-2"}`}
                  >
                    <t.icon className="size-3.5" /> {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex min-h-0 min-w-0 flex-col md:overflow-y-auto">
            <div className="flex-1 px-5 pb-4 pt-5 md:px-7 md:pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tan">{category?.name}</p>
              <h2 className="font-display mt-2 pr-10 text-[30px] font-semibold leading-[1.05] text-ink md:text-[36px]">{p.name}</h2>
              <div className="mt-3 flex items-baseline gap-2">
                {price < p.price && <span className="tabular text-sm text-muted line-through">{brl(p.price)}</span>}
                <span className="tabular font-display text-2xl font-semibold text-ink">{brl(price)}</span>
                <span className="text-sm text-muted">{unitSuffix(p.unit)}</span>
                {p.badge && (
                  <span className="ml-auto rounded-full border border-tan/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-tan">
                    {p.badge}
                  </span>
                )}
              </div>
              {p.description && <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{p.description}</p>}
              {p.prep_tags.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                    <Flame className="size-3.5 text-red-bright" /> Ideal para
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.prep_tags.map((t) => (
                      <span key={t} className="rounded-full bg-surface-3 px-3 py-1 text-xs text-ink-2">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {p.available ? (
                <>
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="mb-3 text-sm font-medium text-ink">Quanto você quer?</p>
                    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
                      {QTY_PRESETS[p.unit].map((q) => (
                        <button
                          key={q}
                          onClick={() => setLocalQty(q)}
                          className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition ${
                            qty === q ? "border-red bg-red text-white" : "border-line-strong text-ink-2 hover:border-tan/50"
                          }`}
                        >
                          {formatQty(q, p.unit)}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <QtyStepper qty={qty} unit={p.unit} onChange={(q) => setLocalQty(Math.max(QTY_MIN[p.unit], p.unit === "kg" ? roundQty(q, "kg") : Math.round(q)))} />
                      {p.unit === "kg" && <span className="text-xs text-muted">de 250 em 250 g</span>}
                    </div>
                  </div>

                  <div className="mt-5">
                    <label htmlFor="obs" className="mb-2 block text-sm font-medium text-ink">
                      Como prefere o corte? <span className="font-normal text-muted">(opcional)</span>
                    </label>
                    <div className="no-scrollbar -mx-5 mb-2 flex gap-1.5 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
                      {noteHints(p).map((h) => (
                        <button
                          key={h}
                          onClick={() => setLocalNotes((n) => (n.includes(h) ? n : n ? `${n}, ${h.toLowerCase()}` : h))}
                          className="shrink-0 rounded-full border border-dashed border-line-strong px-3 py-1 text-xs text-muted transition hover:border-tan/60 hover:text-ink"
                        >
                          + {h}
                        </button>
                      ))}
                    </div>
                    <textarea
                      id="obs"
                      value={notes}
                      onChange={(e) => setLocalNotes(e.target.value.slice(0, 200))}
                      rows={2}
                      placeholder="Ex.: bifes de 2 cm, porções de 500 g…"
                      className="focus-ring w-full resize-none rounded-xl border border-line-strong bg-bg-2 px-4 py-3 text-sm text-ink placeholder:text-muted/70"
                    />
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-line bg-surface-2 p-4 text-sm text-ink-2">
                  Este corte esgotou por hoje. Fale com a gente no WhatsApp para encomendar.
                </div>
              )}
            </div>

            {p.available && (
              <div className="sticky bottom-0 border-t border-line bg-surface/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur md:px-7">
                <button
                  onClick={submit}
                  className="focus-ring flex h-14 w-full items-center justify-between rounded-2xl bg-red px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(179,32,27,.9)] transition hover:bg-red-bright active:scale-[.98]"
                >
                  <span>{existing ? "Atualizar pedido" : "Adicionar ao pedido"}</span>
                  <span className="tabular">{brl(money(price, qty))}</span>
                </button>
                {p.unit === "kg" && (
                  <p className="mt-2 text-center text-[11px] text-muted">Valor estimado — o peso final é confirmado na balança.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
