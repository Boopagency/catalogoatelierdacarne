"use client";

import { CutDiagram } from "@/components/cut-diagram";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  fallbackCover?: string | null;
  variant?: "card" | "thumb";
  className?: string;
};

/** Foto do produto; sem foto, o mapa do corte em giz; sem mapa, a foto da categoria. */
export function ProductVisual({ product, fallbackCover, variant = "card", className = "" }: Props) {
  const hasDiagram = product.animal && product.cut_regions.length > 0;
  if (product.image_url) {
    return (
      <div className={`relative overflow-hidden bg-surface ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt={product.name} loading="lazy" className="absolute inset-0 size-full object-cover" />
      </div>
    );
  }
  if (hasDiagram) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <CutDiagram
          animal={product.animal!}
          regions={product.cut_regions}
          variant={variant === "thumb" ? "mini" : "full"}
          className={`absolute inset-0 m-auto h-auto ${variant === "thumb" ? "w-[94%]" : "w-[82%]"}`}
        />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      {fallbackCover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fallbackCover} alt="" loading="lazy" className="poster-img absolute inset-0 size-full object-cover opacity-80" />
      )}
    </div>
  );
}
