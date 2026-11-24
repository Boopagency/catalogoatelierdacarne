import "server-only";
import raw from "@/data/catalog.json";
import type { Animal } from "./anatomy";
import { slugify } from "./format";
import { getSheetCatalog } from "./sheet";
import type { Catalog, CategoryWithProducts, Kit, Product, Settings } from "./types";

type RawProduct = {
  n: string; p: number; u?: "kg" | "un"; r?: string[]; a?: Animal; d?: string; t?: string[]; b?: string; f?: boolean;
};

/** Catálogo base do catalog.json: textos, capas, mapa de cortes e preços de reserva. */
function rawCatalog(): Catalog {
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
    old_price: (k as { old_price?: number }).old_price ?? null,
    promo_quarta: Boolean((k as { promo_quarta?: boolean }).promo_quarta),
    image_url: k.image,
    badge: k.badge,
    note: (k as { note?: string }).note ?? null,
    available: true,
    sort_order: ki,
  }));
  return { settings: raw.settings as Settings, categories, kits };
}

/** Kit com promoção "só às quartas": nos outros dias volta ao preço "de" (horário de Brasília). */
export function isWednesday() {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(new Date()) === "Wed";
}
function applyWednesday(c: Catalog): Catalog {
  if (isWednesday()) return c;
  return {
    ...c,
    kits: c.kits.map((k) => (k.promo_quarta && k.old_price ? { ...k, price: k.old_price, old_price: null } : k)),
  };
}

/** Preços vêm da planilha (SHEET_URL); sem ela, do catalog.json. */
export async function getCatalog(): Promise<Catalog> {
  const sheet = process.env.SHEET_URL;
  return applyWednesday(sheet ? await getSheetCatalog(sheet, rawCatalog()) : rawCatalog());
}
