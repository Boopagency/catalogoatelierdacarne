"use client";

import { supabaseBrowser } from "./supabase/client";

let timer: ReturnType<typeof setTimeout> | null = null;

/** Pede ao servidor para regenerar o catálogo público (agrupa várias edições seguidas). */
export function revalidateCatalog() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    fetch("/api/revalidate", { method: "POST" }).catch(() => {});
  }, 800);
}

export const sb = () => supabaseBrowser();

/** Redimensiona a imagem no navegador e envia para o bucket "catalogo". */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Falha ao converter imagem"))), "image/webp", 0.85));
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
  const { error } = await sb().storage.from("catalogo").upload(path, blob, { contentType: "image/webp", upsert: false });
  if (error) throw error;
  return sb().storage.from("catalogo").getPublicUrl(path).data.publicUrl;
}

export function parseMoney(v: string): number | null {
  const clean = v.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

export const moneyInput = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : n.toFixed(2).replace(".", ",");
