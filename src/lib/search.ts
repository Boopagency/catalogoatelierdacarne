import { ANATOMY } from "./anatomy";
import { normalize } from "./format";
import type { CategoryWithProducts, Product } from "./types";

// termos que o cliente digita → termos que existem no catálogo
const SYNONYMS: Record<string, string[]> = {
  ribeye: ["ancho"],
  "rib eye": ["ancho"],
  entrecot: ["ancho"],
  entrecote: ["ancho"],
  chorizo: ["contra file"],
  "contra file": ["contrafile"],
  contrafile: ["contra file"],
  filet: ["mignon"],
  file: ["file", "mignon"],
  tenderloin: ["mignon"],
  costelinha: ["costela"],
  burger: ["hamburguer"],
  hamburger: ["hamburguer"],
  hamburgue: ["hamburguer"],
  moida: ["moido"],
  carne: ["bovino"],
  boi: ["bovino"],
  vaca: ["bovino"],
  porco: ["suino"],
  porc: ["suino"],
  galinha: ["frango"],
  espeto: ["espetinho"],
  asinha: ["coxinha da asa", "tulipa"],
  asa: ["coxinha da asa", "tulipa"],
  linguica: ["linguica"],
  salsicha: ["linguica"],
  churrasco: ["churrasco"],
  steak: ["steak", "bife"],
  bife: ["bife", "steak"],
  milanesa: ["milanesa"],
  strogonof: ["strogonoff"],
  estrogonofe: ["strogonoff"],
  estrogonofi: ["strogonoff"],
  kit: ["kit"],
};

export type SearchDoc = { product: Product; category: CategoryWithProducts; hay: string; words: string[]; name: string };

export function buildIndex(categories: CategoryWithProducts[]): SearchDoc[] {
  return categories.flatMap((category) =>
    category.products.map((product) => {
      const regionNames = product.animal
        ? product.cut_regions.map((r) => ANATOMY[product.animal!].labels[r] ?? r)
        : [];
      const hay = normalize(
        [product.name, category.name, product.animal ?? "", product.badge ?? "", ...product.prep_tags, ...regionNames, product.description ?? ""].join(" ")
      );
      return { product, category, hay, words: hay.split(/[^a-z0-9]+/).filter(Boolean), name: normalize(product.name) };
    })
  );
}

function lev1(a: string, b: string) {
  // true se a distância de edição for <= 1
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function tokenScore(token: string, doc: SearchDoc): number {
  if (doc.name.startsWith(token)) return 6;
  if (doc.name.split(" ").some((w) => w.startsWith(token))) return 5;
  if (doc.words.some((w) => w.startsWith(token))) return 3;
  if (doc.hay.includes(token)) return 2;
  if (token.length >= 4 && doc.words.some((w) => lev1(token, w.slice(0, token.length)) || lev1(token, w))) return 1;
  return 0;
}

export function search(index: SearchDoc[], query: string): SearchDoc[] {
  const q = normalize(query).trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const variants = (t: string) => [t, ...(SYNONYMS[t] ?? [])];
  const phraseSyn = SYNONYMS[q];

  const scored = index
    .map((doc) => {
      let total = 0;
      for (const t of tokens) {
        const best = Math.max(...variants(t).map((v) => (v.includes(" ") ? (doc.hay.includes(v) ? 4 : 0) : tokenScore(v, doc))));
        if (best === 0) return { doc, score: 0 };
        total += best;
      }
      if (phraseSyn?.some((s) => doc.hay.includes(s))) total += 3;
      if (doc.name.includes(q)) total += 4;
      if (!doc.product.available) total -= 2;
      return { doc, score: total };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.product.name.localeCompare(b.doc.product.name));
  return scored.map((r) => r.doc);
}

export const SEARCH_SUGGESTIONS = ["Picanha", "Ancho", "Costela", "Mignon", "Linguiça", "Hambúrguer", "Coxinha da asa", "Strogonoff"];
