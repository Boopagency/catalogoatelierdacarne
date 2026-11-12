"use client";

import { CutDiagram } from "@/components/cut-diagram";
import { regionLabel } from "@/lib/anatomy";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  fallbackCover?: string | null;
  variant?: "card" | "thumb";
  className?: string;
};

/** Foto do produto; sem foto, mostra o mapa do corte; sem mapa, a foto da categoria. */
export function ProductVisual({ product, fallbackCover, variant = "card", className = "" }: Props) {
  const hasDiagram = product.animal && product.cut_regions.length > 0;
  if (product.image_url) {
    return (
      <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt={product.name} loading="lazy" className="absolute inset-0 size-full object-cover" />
      </div>
    );
  }
  if (hasDiagram) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ background: "radial-gradient(120% 90% at 50% 40%, #241d18 0%, #15110e 70%)" }}
      >
        <CutDiagram
          animal={product.animal!}
          regions={product.cut_regions}
          variant={variant === "thumb" ? "mini" : "full"}
          className={`absolute inset-0 m-auto ${variant === "thumb" ? "w-[92%]" : "w-[84%]"} h-auto top-0 bottom-0`}
        />
        {variant === "card" && (
          <span className="absolute bottom-2.5 left-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-tan/90">
            {regionLabel(product.animal!, product.cut_regions[0]).split(" · ")[0]}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {fallbackCover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fallbackCover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-70 saturate-[.85]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
    </div>
  );
}
