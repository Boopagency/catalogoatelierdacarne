import "server-only";
import raw from "@/data/catalog.json";
import type { Animal } from "./anatomy";
import { slugify } from "./format";
import { isSupabaseConfigured } from "./supabase/config";
import { supabasePublic } from "./supabase/server";
import type { Catalog, CategoryWithProducts, Kit, Product, Settings } from "./types";

type RawProduct = {
  n: string; p: number; u?: "kg" | "un"; r?: string[]; a?: Animal; d?: string; t?: string[]; b?: string; f?: boolean;
};

/** Catálogo a partir do JSON (modo demonstração, sem Supabase). */
export function catalogFromJson(): Catalog {
  const categories: CategoryWithProducts[] = raw.categories.map((c, ci) => ({
    id: c.slug,
    slug: c.slug,
    name: c.name,
    subtitle: c.subtitle,
    animal: (c.animal as Animal | null) ?? null,
    cover_url: c.cover,
    sort_order: ci,
    active: true,
    products: (c.products as RawProduct[]).map(
      (p, pi): Product => ({
        id: slugify(p.n),
        category_id: c.slug,
        slug: slugify(p.n),
        name: p.n,
        description: p.d ?? null,
        unit: p.u ?? "kg",
        price: p.p,
        promo_price: null,
        image_url: null,
        animal: p.a ?? (c.animal as Animal | null) ?? null,
        cut_regions: p.r ?? [],
        prep_tags: p.t ?? [],
        badge: p.b ?? null,
        available: true,
        featured: Boolean(p.f),
        sort_order: pi,
      })
    ),
  }));
  const kits: Kit[] = raw.kits.map((k, ki) => ({
    id: slugify(k.name),
    slug: slugify(k.name),
    name: k.name,
    tagline: k.tagline,
    items: k.items,
    price: k.price,
    old_price: null,
    image_url: k.image,
    badge: k.badge,
    note: (k as { note?: string }).note ?? null,
    available: true,
    sort_order: ki,
  }));
  return { settings: raw.settings as Settings, categories, kits, live: false };
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function getCatalog(): Promise<Catalog> {
  if (!isSupabaseConfigured()) return catalogFromJson();
  const sb = supabasePublic();
  const [settings, categories, products, kits] = await Promise.all([
    sb.from("settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("categories").select("*").eq("active", true).order("sort_order"),
    sb.from("products").select("*").order("sort_order").order("name"),
    sb.from("kits").select("*").order("sort_order"),
  ]);
  const err = settings.error || categories.error || products.error || kits.error;
  if (err) {
    console.error("Falha ao ler catálogo do Supabase", err);
    return catalogFromJson();
  }
  const prods = (products.data ?? []).map(
    (p): Product => ({ ...p, price: Number(p.price), promo_price: num(p.promo_price) })
  );
  return {
    settings: (settings.data as Settings) ?? catalogFromJson().settings,
    categories: (categories.data ?? []).map((c) => ({
      ...c,
      products: prods.filter((p) => p.category_id === c.id),
    })),
    kits: (kits.data ?? []).map((k): Kit => ({ ...k, price: Number(k.price), old_price: num(k.old_price) })),
    live: true,
  };
}
