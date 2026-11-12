"use client";

import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { useCart } from "@/lib/cart";
import { brl, effectivePrice, QTY_DEFAULT, unitSuffix } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductVisual } from "./product-visual";
import { toast } from "sonner";

type Props = { product: Product; cover?: string | null; onOpen: (p: Product) => void; index?: number };

export function ProductCard({ product, cover, onOpen, index = 0 }: Props) {
  const key = `product:${product.id}`;
  const line = useCart((s) => s.lines.find((l) => l.key === key));
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const price = effectivePrice(product);
  const promo = price < product.price;
  const soldOut = !product.available;

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    add({
      type: "product",
      id: product.id,
      name: product.name,
      unit: product.unit,
      price,
      qty: QTY_DEFAULT[product.unit],
      image: product.image_url,
      animal: product.animal,
      regions: product.cut_regions,
    });
    toast.success(`${product.name} adicionado`, { description: "Toque no card para ajustar a quantidade ou deixar uma observação.", duration: 2200 });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onOpen(product)}
      className={`group relative flex cursor-pointer gap-4 border-b border-line py-3.5 transition md:flex-col md:gap-0 md:overflow-hidden md:rounded-2xl md:border md:bg-surface md:py-0 md:hover:-translate-y-0.5 md:hover:border-tan/30 md:hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,.8)] ${
        soldOut ? "opacity-55" : ""
      } ${line ? "md:border-red/50" : ""}`}
    >
      <div className="relative shrink-0">
        <ProductVisual
          product={product}
          fallbackCover={cover}
          variant="thumb"
          className="size-[84px] rounded-xl border border-line md:hidden"
        />
        <ProductVisual product={product} fallbackCover={cover} className="hidden aspect-[4/3] w-full md:block" />
        {product.badge && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-tan backdrop-blur md:left-3 md:top-3 md:text-[10px]">
            {product.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-black/75 py-1 text-center text-[9px] font-semibold uppercase tracking-widest text-ink md:py-1.5 md:text-[10px]">
            Esgotado hoje
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between md:p-4">
        <div>
          <h3 className="text-[15px] font-medium leading-snug text-ink md:text-base">{product.name}</h3>
          {product.prep_tags.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-muted">{product.prep_tags.slice(0, 3).join(" · ")}</p>
          )}
        </div>
        <div className="mt-2 flex items-end justify-between gap-2 md:mt-4">
          <div className="leading-none">
            {promo && <span className="tabular mb-1 block text-xs text-muted line-through">{brl(product.price)}</span>}
            <span className={`tabular font-display text-[19px] font-semibold md:text-[22px] ${promo ? "text-red-bright" : "text-ink"}`}>
              {brl(price)}
            </span>
            <span className="ml-1 text-xs text-muted">{unitSuffix(product.unit)}</span>
          </div>
          {!soldOut &&
            (line ? (
              <QtyStepper qty={line.qty} unit={line.unit} onChange={(q) => setQty(key, q)} size="sm" tone="red" />
            ) : (
              <button
                onClick={quickAdd}
                aria-label={`Adicionar ${product.name}`}
                className="focus-ring grid size-9 shrink-0 place-items-center rounded-full border border-line-strong bg-surface-3 text-ink transition hover:border-red hover:bg-red hover:text-white active:scale-90"
              >
                <Plus className="size-4" />
              </button>
            ))}
        </div>
      </div>
    </motion.article>
  );
}
