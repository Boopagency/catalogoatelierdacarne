"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Percent, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CutDiagram } from "@/components/cut-diagram";
import { ProductVisual } from "@/components/store/product-visual";
import { Sheet } from "@/components/ui/sheet";
import { moneyInput, parseMoney, revalidateCatalog, sb } from "@/lib/admin";
import { ANATOMY, type Animal } from "@/lib/anatomy";
import { brl, normalize, slugify } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { Button, Field, ImagePicker, Input, PageHeader, Select, Skeleton, Switch, Textarea } from "./ui";

const BADGES = ["Mais pedido", "Premium", "Novo", "Promoção", "Temperado", "Recheado"];
const TAGS = ["Churrasco", "Grelha", "Parrilla", "Forno", "Panela", "Frigideira", "Airfryer", "Bifes", "Moído", "Defumação", "Feijoada"];

const toProduct = (p: Record<string, unknown>) =>
  ({ ...p, price: Number(p.price), promo_price: p.promo_price === null ? null : Number(p.promo_price) }) as Product;

export function ProductsPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [onlyOut, setOnlyOut] = useState(false);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [bulk, setBulk] = useState(false);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      sb().from("categories").select("*").order("sort_order"),
      sb().from("products").select("*").order("sort_order").order("name"),
    ]);
    if (c.error || p.error) return toast.error("Erro ao carregar produtos");
    setCategories(c.data as Category[]);
    setProducts((p.data ?? []).map(toProduct));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const patch = useCallback(async (p: Product, changes: Partial<Product>, msg?: string) => {
    const before = p;
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, ...changes } : x)));
    const { error } = await sb().from("products").update(changes).eq("id", p.id);
    if (error) {
      setProducts((list) => list.map((x) => (x.id === p.id ? before : x)));
      toast.error("Não foi possível salvar", { description: error.message });
      return false;
    }
    revalidateCatalog();
    if (msg) {
      const undo = Object.fromEntries(Object.keys(changes).map((k) => [k, before[k as keyof Product]])) as Partial<Product>;
      toast.success(msg, { action: { label: "Desfazer", onClick: () => patch({ ...before, ...changes }, undo) } });
    }
    return true;
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return products.filter(
      (p) => (cat === "todas" || p.category_id === cat) && (!onlyOut || !p.available) && (!q || normalize(p.name).includes(q))
    );
  }, [products, query, cat, onlyOut]);

  const outCount = products.filter((p) => !p.available).length;

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} produtos · ${outCount} esgotado${outCount === 1 ? "" : "s"} · o preço salva sozinho ao sair do campo`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setBulk(true)}>
              <Percent className="size-4" /> Reajuste em massa
            </Button>
            <Button onClick={() => setEditing("new")}>
              <Plus className="size-4" /> Novo produto
            </Button>
          </>
        }
      />

      <div className="sticky top-14 z-20 -mx-4 mb-4 space-y-3 bg-bg/90 px-4 pb-3 pt-1 backdrop-blur-xl md:top-0 md:mx-0 md:px-0 md:pt-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto" className="pl-10" />
          </div>
          <button
            onClick={() => setOnlyOut((v) => !v)}
            className={`h-11 shrink-0 rounded-xl border px-3.5 text-sm transition ${onlyOut ? "border-red bg-red/15 text-ink" : "border-line-strong text-ink-2"}`}
          >
            Esgotados {outCount > 0 && <span className="tabular text-xs opacity-70">({outCount})</span>}
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {[{ id: "todas", name: "Todas" }, ...(categories ?? [])].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`h-8 shrink-0 rounded-full border px-3 text-[13px] transition ${cat === c.id ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:text-ink"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {!categories ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)}</div>
      ) : (
        <div className="space-y-8">
          {categories
            .filter((c) => filtered.some((p) => p.category_id === c.id))
            .map((c) => (
              <section key={c.id}>
                <h2 className="mb-2 flex items-baseline gap-2 px-1">
                  <span className="font-display text-xl font-semibold text-ink">{c.name}</span>
                  {!c.active && <span className="text-xs text-warn">categoria oculta</span>}
                </h2>
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                  {filtered
                    .filter((p) => p.category_id === c.id)
                    .map((p) => (
                      <ProductRow key={p.id} product={p} cover={c.cover_url} onPatch={patch} onEdit={() => setEditing(p)} />
                    ))}
                </div>
              </section>
            ))}
          {filtered.length === 0 && <p className="py-16 text-center text-sm text-muted">Nenhum produto encontrado.</p>}
        </div>
      )}

      <ProductEditor
        product={editing}
        categories={categories ?? []}
        defaultCategory={cat !== "todas" ? cat : categories?.[0]?.id}
        onClose={() => setEditing(null)}
        onSaved={(p, isNew) => {
          setProducts((list) => (isNew ? [...list, p] : list.map((x) => (x.id === p.id ? p : x))));
          setEditing(null);
        }}
        onDeleted={(id) => {
          setProducts((list) => list.filter((x) => x.id !== id));
          setEditing(null);
        }}
      />
      <BulkAdjust open={bulk} onClose={() => setBulk(false)} categories={categories ?? []} products={products} onDone={load} />
    </>
  );
}

function PriceInput({ value, onCommit, label }: { value: number; onCommit: (n: number) => void; label: string }) {
  const [text, setText] = useState(moneyInput(value));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => setText(moneyInput(value)), [value]);
  const commit = () => {
    const n = parseMoney(text);
    if (n === null || n <= 0) {
      setText(moneyInput(value));
      if (text.trim()) toast.error("Preço inválido");
      return;
    }
    setText(moneyInput(n));
    if (n !== value) onCommit(n);
  };
  return (
    <label className="relative block" onClick={(e) => e.stopPropagation()}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">R$</span>
      <input
        ref={ref}
        aria-label={label}
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") ref.current?.blur();
          if (e.key === "Escape") {
            setText(moneyInput(value));
            requestAnimationFrame(() => ref.current?.blur());
          }
        }}
        className="focus-ring tabular h-10 w-[112px] rounded-xl border border-line-strong bg-bg-2 pl-9 pr-2 text-right text-[15px] font-semibold text-ink transition focus:border-red"
      />
    </label>
  );
}

function ProductRow({
  product: p,
  cover,
  onPatch,
  onEdit,
}: {
  product: Product;
  cover: string | null;
  onPatch: (p: Product, c: Partial<Product>, msg?: string) => Promise<boolean>;
  onEdit: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 transition md:gap-4 md:px-4 ${p.available ? "" : "bg-bg-2/60"}`}>
      <button onClick={onEdit} className="shrink-0" aria-label={`Editar ${p.name}`}>
        <ProductVisual product={p} fallbackCover={cover} variant="thumb" className={`size-12 rounded-xl border border-line ${p.available ? "" : "opacity-40"}`} />
      </button>
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-[15px] font-medium ${p.available ? "text-ink" : "text-muted line-through decoration-muted/50"}`}>{p.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          por {p.unit === "kg" ? "kg" : "unidade"}
          {p.promo_price !== null && <span className="text-red-bright"> · promo {brl(p.promo_price)}</span>}
          {p.badge && <span className="text-tan"> · {p.badge}</span>}
          {!p.available && <span className="text-warn"> · esgotado</span>}
        </p>
      </button>
      <PriceInput
        value={p.price}
        label={`Preço de ${p.name}`}
        onCommit={(n) => onPatch(p, { price: n }, `${p.name}: ${brl(p.price)} → ${brl(n)}`)}
      />
      <div className="hidden flex-col items-center gap-0.5 sm:flex">
        <Switch checked={p.available} onChange={(v) => onPatch(p, { available: v }, v ? `${p.name} disponível` : `${p.name} marcado como esgotado`)} label="Disponível" />
        <span className="text-[10px] text-muted">{p.available ? "à venda" : "esgotado"}</span>
      </div>
      <div className="sm:hidden">
        <Switch checked={p.available} onChange={(v) => onPatch(p, { available: v }, v ? `${p.name} disponível` : `${p.name} esgotado`)} label="Disponível" />
      </div>
      <button
        onClick={() => onPatch(p, { featured: !p.featured })}
        aria-label="Destaque"
        className={`hidden size-9 place-items-center rounded-full transition md:grid ${p.featured ? "text-warn" : "text-muted hover:text-ink"}`}
        title="Destaque"
      >
        <Star className="size-[18px]" fill={p.featured ? "currentColor" : "none"} />
      </button>
      <button onClick={onEdit} aria-label="Editar" className="hidden size-9 place-items-center rounded-full text-muted transition hover:bg-surface-3 hover:text-ink md:grid">
        <Pencil className="size-4" />
      </button>
    </div>
  );
}

type Draft = Omit<Product, "id" | "slug" | "sort_order"> & { id?: string };

function ProductEditor({
  product,
  categories,
  defaultCategory,
  onClose,
  onSaved,
  onDeleted,
}: {
  product: Product | "new" | null;
  categories: Category[];
  defaultCategory?: string;
  onClose: () => void;
  onSaved: (p: Product, isNew: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const [d, setD] = useState<Draft | null>(null);
  const [price, setPrice] = useState("");
  const [promo, setPromo] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    const cat = categories.find((c) => c.id === (product === "new" ? defaultCategory : product.category_id));
    const base: Draft =
      product === "new"
        ? {
            category_id: cat?.id ?? "",
            name: "",
            description: null,
            unit: "kg",
            price: 0,
            promo_price: null,
            image_url: null,
            animal: cat?.animal ?? null,
            cut_regions: [],
            prep_tags: [],
            badge: null,
            available: true,
            featured: false,
          }
        : { ...product };
    setD(base);
    setPrice(product === "new" ? "" : moneyInput(base.price));
    setPromo(moneyInput(base.promo_price));
    setTags(base.prep_tags.join(", "));
  }, [product, categories, defaultCategory]);

  const set = (patch: Partial<Draft>) => setD((x) => (x ? { ...x, ...patch } : x));

  const save = async () => {
    if (!d) return;
    const p = parseMoney(price);
    const pp = promo.trim() ? parseMoney(promo) : null;
    if (!d.name.trim()) return toast.error("Dê um nome ao produto");
    if (!p) return toast.error("Informe o preço");
    if (promo.trim() && (pp === null || pp >= p)) return toast.error("O preço promocional precisa ser menor que o preço normal");
    setSaving(true);
    const row = {
      category_id: d.category_id,
      name: d.name.trim(),
      description: d.description?.trim() || null,
      unit: d.unit,
      price: p,
      promo_price: pp,
      image_url: d.image_url,
      animal: d.animal,
      cut_regions: d.animal ? d.cut_regions : [],
      prep_tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      badge: d.badge?.trim() || null,
      available: d.available,
      featured: d.featured,
    };
    const isNew = !d.id;
    const res = isNew
      ? await sb().from("products").insert({ ...row, slug: `${slugify(row.name)}-${Math.random().toString(36).slice(2, 6)}`, sort_order: 999 }).select().single()
      : await sb().from("products").update(row).eq("id", d.id!).select().single();
    setSaving(false);
    if (res.error) return toast.error("Não foi possível salvar", { description: res.error.message });
    revalidateCatalog();
    toast.success(isNew ? "Produto criado" : "Produto salvo");
    onSaved(toProduct(res.data), isNew);
  };

  const remove = async () => {
    if (!d?.id || !confirm(`Excluir "${d.name}" do catálogo? Pedidos antigos continuam guardados.`)) return;
    const { error } = await sb().from("products").delete().eq("id", d.id);
    if (error) return toast.error("Não foi possível excluir", { description: error.message });
    revalidateCatalog();
    toast.success("Produto excluído");
    onDeleted(d.id);
  };

  const toggleRegion = (r: string) => d && set({ cut_regions: d.cut_regions.includes(r) ? d.cut_regions.filter((x) => x !== r) : [...d.cut_regions, r] });

  return (
    <Sheet open={Boolean(product)} onClose={onClose} side="right" label="Editar produto">
      {d && (
        <>
          <div className="border-b border-line px-5 pb-4 pt-4 md:pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-tan">{d.id ? "Editar produto" : "Novo produto"}</p>
            <h2 className="font-display mt-1 truncate pr-10 text-2xl font-semibold text-ink">{d.name || "Sem nome"}</h2>
          </div>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <ImagePicker value={d.image_url} onChange={(url) => set({ image_url: url })} folder="produtos" />
            <Field label="Nome">
              <Input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex.: Picanha Bovina" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria">
                <Select value={d.category_id} onChange={(e) => {
                  const c = categories.find((x) => x.id === e.target.value);
                  set({ category_id: e.target.value, ...(d.cut_regions.length === 0 && c?.animal ? { animal: c.animal } : {}) });
                }}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Vendido por">
                <div className="grid h-11 grid-cols-2 gap-1 rounded-xl border border-line-strong bg-bg-2 p-1">
                  {(["kg", "un"] as const).map((u) => (
                    <button type="button" key={u} onClick={() => set({ unit: u })} className={`rounded-lg text-sm font-medium ${d.unit === u ? "bg-ink text-bg" : "text-ink-2"}`}>
                      {u === "kg" ? "Quilo" : "Unidade"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Preço (R$/${d.unit})`}>
                <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" className="tabular font-semibold" />
              </Field>
              <Field label="Promoção (opcional)" hint="Aparece riscando o preço normal">
                <Input inputMode="decimal" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="—" className="tabular" />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-bg-2/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Disponível hoje</p>
                <p className="text-xs text-muted">Desligue quando acabar — aparece como esgotado</p>
              </div>
              <Switch checked={d.available} onChange={(v) => set({ available: v })} />
            </div>
            <Field label="Selo (opcional)">
              <Input value={d.badge ?? ""} onChange={(e) => set({ badge: e.target.value })} placeholder="Ex.: Mais pedido" maxLength={20} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BADGES.map((b) => (
                  <button type="button" key={b} onClick={() => set({ badge: d.badge === b ? null : b })} className={`rounded-full border px-2.5 py-1 text-xs ${d.badge === b ? "border-tan bg-tan/15 text-ink" : "border-line-strong text-muted hover:text-ink"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Descrição (opcional)">
              <Textarea rows={3} value={d.description ?? ""} onChange={(e) => set({ description: e.target.value })} placeholder="Conte o que torna esse corte especial" />
            </Field>
            <Field label="Ideal para" hint="Separe por vírgula">
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Churrasco, Grelha" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAGS.filter((t) => !tags.toLowerCase().includes(t.toLowerCase())).map((t) => (
                  <button type="button" key={t} onClick={() => setTags((x) => (x.trim() ? `${x.replace(/,\s*$/, "")}, ${t}` : t))} className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs text-muted hover:text-ink">
                    + {t}
                  </button>
                ))}
              </div>
            </Field>

            <div className="rounded-2xl border border-line bg-bg-2/60 p-4">
              <p className="text-sm font-medium text-ink">Mapa do corte</p>
              <p className="mt-0.5 text-xs text-muted">Escolha o animal e toque nas partes de onde o corte sai.</p>
              <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl border border-line-strong bg-bg-2 p-1">
                {([null, "bovino", "suino", "frango"] as (Animal | null)[]).map((a) => (
                  <button type="button" key={a ?? "none"} onClick={() => set({ animal: a, cut_regions: [] })} className={`h-9 rounded-lg text-[13px] font-medium ${d.animal === a ? "bg-ink text-bg" : "text-ink-2"}`}>
                    {a === null ? "Nenhum" : a === "bovino" ? "Boi" : a === "suino" ? "Porco" : "Frango"}
                  </button>
                ))}
              </div>
              {d.animal && (
                <>
                  <div className="mt-3 rounded-xl bg-surface p-2">
                    <CutDiagram animal={d.animal} regions={d.cut_regions} onToggle={toggleRegion} className="w-full" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(ANATOMY[d.animal].labels)
                      .filter(([id]) => !["pescoco", "dorso"].includes(id) && (id !== "cabeca" || d.animal === "suino"))
                      .map(([id, label]) => (
                        <button type="button" key={id} onClick={() => toggleRegion(id)} className={`rounded-full border px-2.5 py-1 text-xs transition ${d.cut_regions.includes(id) ? "border-red bg-red/20 text-ink" : "border-line-strong text-muted hover:text-ink"}`}>
                          {label.split(" · ")[0]}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-bg-2/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Destaque</p>
                <p className="text-xs text-muted">Marcação interna para os cortes queridinhos</p>
              </div>
              <Switch checked={d.featured} onChange={(v) => set({ featured: v })} />
            </div>
          </div>
          <div className="flex gap-2 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            {d.id && (
              <Button variant="danger" onClick={remove} aria-label="Excluir produto">
                <Trash2 className="size-4" />
              </Button>
            )}
            <Button className="flex-1" onClick={save} loading={saving}>
              {d.id ? "Salvar alterações" : "Criar produto"}
            </Button>
          </div>
        </>
      )}
    </Sheet>
  );
}

function BulkAdjust({
  open,
  onClose,
  categories,
  products,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  onDone: () => void;
}) {
  const [cat, setCat] = useState("todas");
  const [pct, setPct] = useState("5");
  const [round99, setRound99] = useState(true);
  const [busy, setBusy] = useState(false);
  const n = Number(pct.replace(",", "."));
  const target = products.filter((p) => cat === "todas" || p.category_id === cat);
  const calc = (price: number) => {
    let v = price * (1 + n / 100);
    if (round99) v = Math.max(0.99, Math.round(v) - 0.01);
    return Math.round(v * 100) / 100;
  };
  const apply = async () => {
    if (!Number.isFinite(n) || n === 0 || Math.abs(n) > 80) return toast.error("Informe um percentual entre -80% e 80%");
    setBusy(true);
    const results = await Promise.all(target.map((p) => sb().from("products").update({ price: calc(p.price) }).eq("id", p.id)));
    setBusy(false);
    const failed = results.filter((r) => r.error).length;
    if (failed) toast.error(`${failed} produtos não foram atualizados`);
    else toast.success(`${target.length} preços reajustados`);
    revalidateCatalog();
    onDone();
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} label="Reajuste em massa">
      <div className="space-y-5 overflow-y-auto px-5 pb-6 pt-6 md:px-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-tan">Ferramenta</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink">Reajuste em massa</h2>
          <p className="mt-1 text-sm text-muted">Aumente ou reduza vários preços de uma vez — por exemplo, quando o fornecedor reajustar.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <Select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="todas">Todas</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Percentual" hint="Use negativo para reduzir">
            <Input inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} className="tabular" />
          </Field>
        </div>
        <label className="flex items-center justify-between rounded-2xl border border-line bg-bg-2/60 px-4 py-3">
          <span className="text-sm text-ink">Arredondar para ,99</span>
          <Switch checked={round99} onChange={setRound99} />
        </label>
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-line">
          {target.slice(0, 60).map((p) => (
            <div key={p.id} className="flex justify-between gap-3 border-b border-line px-4 py-2 text-sm last:border-0">
              <span className="truncate text-ink-2">{p.name}</span>
              <span className="tabular shrink-0 text-muted">
                {brl(p.price)} → <span className="font-semibold text-ink">{Number.isFinite(n) ? brl(calc(p.price)) : "—"}</span>
              </span>
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={apply} loading={busy}>
          Aplicar em {target.length} produtos
        </Button>
      </div>
    </Sheet>
  );
}
