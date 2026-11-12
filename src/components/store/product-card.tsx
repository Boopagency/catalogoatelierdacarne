"use client";

import { Plus } from "lucide-react";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { useCart } from "@/lib/cart";
import { effectivePrice, QTY_DEFAULT } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Price } from "./price";
import { ProductVisual } from "./product-visual";

type Props = { product: Product; cover?: string | null; onOpen: (p: Product) => void };

export function ProductCard({ product, cover, onOpen }: Props) {
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
  };

  const action = soldOut ? null : line ? (
    <QtyStepper qty={line.qty} unit={line.unit} onChange={(q) => setQty(key, q)} size="sm" tone="red" />
  ) : (
    <button
      onClick={quickAdd}
      aria-label={`Adicionar ${product.name}`}
      className="focus-ring grid size-11 shrink-0 place-items-center border border-line-strong text-ink transition hover:border-red hover:bg-red active:bg-red md:size-9"
    >
      <Plus className="size-4" strokeWidth={1.5} />
    </button>
  );

  return (
    <article
      onClick={() => onOpen(product)}
      className={`group relative cursor-pointer bg-bg transition-colors hover:bg-surface ${line ? "md:shadow-[inset_0_0_0_1px_var(--color-red)]" : ""}`}
    >
      {/* Celular: linha de tabela de preços */}
      <div className="flex gap-4 py-4 md:hidden">
        <div className="relative shrink-0">
          <ProductVisual product={product} fallbackCover={cover} variant="thumb" className={`size-[76px] border border-line ${soldOut ? "opacity-40" : ""}`} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <h3 className={`sign text-[19px] font-bold leading-[1.05] ${soldOut ? "text-muted" : "text-ink"}`}>{product.name}</h3>
            {product.badge && !soldOut && <span className="sign shrink-0 bg-red px-1.5 py-0.5 text-[11px] font-bold text-white">{product.badge}</span>}
          </div>
          {soldOut ? (
            <p className="sign mt-1 text-[13px] font-bold text-red-bright">Esgotado hoje</p>
          ) : (
            product.prep_tags.length > 0 && <p className="mt-1 truncate text-[13px] italic text-muted">{product.prep_tags.slice(0, 3).join(", ")}</p>
          )}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <Price value={price} unit={product.unit} was={promo ? product.price : null} muted={soldOut} />
            {action}
          </div>
        </div>
      </div>

      {/* Desktop: célula da grade */}
      <div className="hidden h-full flex-col md:flex">
        <div className="relative">
          <ProductVisual product={product} fallbackCover={cover} className={`aspect-[4/3] w-full ${soldOut ? "opacity-30" : ""}`} />
          {product.badge && !soldOut && (
            <span className="sign absolute left-0 top-0 bg-red px-2 py-1 text-[12px] font-bold text-white">{product.badge}</span>
          )}
          {soldOut && (
            <span className="stamp absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 text-[15px] font-extrabold">
              Esgotado hoje
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col border-t border-line px-5 pb-5 pt-4">
          <h3 className={`sign text-[22px] font-bold leading-[1.02] ${soldOut ? "text-muted" : "text-ink"}`}>{product.name}</h3>
          {product.prep_tags.length > 0 && <p className="mt-1.5 text-[13px] italic text-muted">{product.prep_tags.slice(0, 3).join(", ")}</p>}
          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <Price value={price} unit={product.unit} was={promo ? product.price : null} muted={soldOut} size="lg" />
            {action}
          </div>
        </div>
      </div>
    </article>
  );
}
