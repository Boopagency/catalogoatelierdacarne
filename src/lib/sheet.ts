// Lê preços da planilha do Google (Arquivo → Compartilhar → Publicar na Web).
// SHEET_URL = link publicado terminando em /pub. Aba Produtos = gid 0, aba Kits = gid 1.
// Linha inválida é ignorada; se a planilha não responder, getSheetCatalog lança erro e o
// Next continua servindo a última página boa.
import type { Catalog, CategoryWithProducts, Kit, Product } from "./types";

/** CSV com aspas ("a, b" e "" dentro de aspas). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") row.push(cell), (cell = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell), rows.push(row), (row = []), (cell = "");
    } else cell += ch;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows;
}

/** "69,99" | "69.99" | "1.234,50" | "R$ 69,99" → número; vazio/inválido → null. */
export function money(v: string | undefined): number | null {
  let s = (v ?? "").replace(/[^\d.,]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

const yes = (v: string | undefined) => /^s/i.test((v ?? "").trim());
const no = (v: string | undefined) => /^n/i.test((v ?? "").trim());
const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Junta as linhas da planilha com o catálogo base (capas, textos, mapa de cortes). */
export function catalogFromRows(base: Catalog, produtos: string[][], kits: string[][]): Catalog {
  const baseProducts = new Map(base.categories.flatMap((c) => c.products).map((p) => [slug(p.name), p]));
  const baseKits = new Map(base.kits.map((k) => [slug(k.name), k]));
  const cats = new Map<string, CategoryWithProducts>();

  for (const [cat, name, preco, promo, unidade, disp] of produtos.slice(1)) {
    const price = money(preco);
    if (!cat?.trim() || !name?.trim() || price === null || no(disp)) continue;
    const key = slug(cat);
    if (!cats.has(key)) {
      const b = base.categories.find((c) => slug(c.name) === key);
      cats.set(key, { ...(b ?? { id: key, slug: key, subtitle: null, animal: null, cover_url: null, active: true }), name: cat.trim(), sort_order: cats.size, products: [] });
    }
    const c = cats.get(key)!;
    const b = baseProducts.get(slug(name));
    const pp = money(promo);
    const p: Product = {
      ...(b ?? { description: null, image_url: null, animal: c.animal, cut_regions: [], prep_tags: [], badge: null, featured: false }),
      id: slug(name),
      slug: slug(name),
      category_id: c.id,
      name: name.trim(),
      unit: unidade?.trim().toLowerCase() === "un" ? "un" : "kg",
      price,
      promo_price: pp !== null && pp < price ? pp : null,
      available: true,
      sort_order: c.products.length,
    };
    c.products.push(p);
  }

  const kitList: Kit[] = [];
  for (const [name, itens, preco, de, quarta, selo, disp] of kits.slice(1)) {
    const price = money(preco);
    if (!name?.trim() || price === null || no(disp)) continue;
    const old = money(de);
    const b = baseKits.get(slug(name));
    kitList.push({
      ...(b ?? { tagline: null, image_url: null, note: null }),
      id: slug(name),
      slug: slug(name),
      name: name.trim(),
      items: (itens ?? "").split("|").map((s) => s.trim()).filter(Boolean),
      price,
      old_price: old !== null && old > price ? old : null,
      promo_quarta: yes(quarta),
      badge: selo?.trim() || null,
      available: true,
      sort_order: kitList.length,
    });
  }

  const categories = [...cats.values()];
  if (!categories.length) throw new Error("Planilha sem produtos válidos");
  return { ...base, categories, kits: kitList };
}

/** Aceita o link como vier do Google (/pubhtml, /pub?output=csv, /edit...) e devolve a base /pub. */
export function sheetBase(url: string) {
  const u = url.trim().split(/[?#]/)[0].replace(/\/(pubhtml|pub|edit|htmlview)\/?$/, "");
  return `${u}/pub`;
}

/** Só aceita CSV cuja primeira coluna do cabeçalho é a esperada; senão é página de erro do Google. */
export function checkHeader(rows: string[][], first: string) {
  if (rows[0]?.[0]?.trim().toLowerCase() !== first) throw new Error(`Aba sem o cabeçalho "${first}": link da planilha errado?`);
  return rows;
}

export async function getSheetCatalog(url: string, base: Catalog): Promise<Catalog> {
  const get = async (gid: number, first: string) => {
    const res = await fetch(`${sheetBase(url)}?gid=${gid}&single=true&output=csv`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Planilha respondeu ${res.status}`);
    return checkHeader(parseCsv(await res.text()), first);
  };
  const [produtos, kits] = await Promise.all([get(0, "categoria"), get(1, "kit")]);
  return catalogFromRows(base, produtos, kits);
}
