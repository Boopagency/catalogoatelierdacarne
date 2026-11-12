"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { moneyInput, parseMoney, revalidateCatalog, sb } from "@/lib/admin";
import { brl, slugify } from "@/lib/format";
import type { Kit } from "@/lib/types";
import { Button, Field, ImagePicker, Input, PageHeader, Skeleton, Switch, Textarea } from "./ui";

const toKit = (k: Record<string, unknown>) => ({ ...k, price: Number(k.price), old_price: k.old_price === null ? null : Number(k.old_price) }) as Kit;

export function KitsPage() {
  const [kits, setKits] = useState<Kit[] | null>(null);
  const [editing, setEditing] = useState<Kit | "new" | null>(null);

  useEffect(() => {
    sb().from("kits").select("*").order("sort_order").then(({ data }) => setKits((data ?? []).map(toKit)));
  }, []);

  const toggle = async (k: Kit, available: boolean) => {
    setKits((l) => l?.map((x) => (x.id === k.id ? { ...x, available } : x)) ?? null);
    const { error } = await sb().from("kits").update({ available }).eq("id", k.id);
    if (error) return toast.error("Não foi possível salvar");
    revalidateCatalog();
    toast.success(available ? `${k.name} visível no catálogo` : `${k.name} ocultado`);
  };

  return (
    <>
      <PageHeader
        title="Kits & promoções"
        subtitle="Aparecem em destaque no topo do catálogo"
        actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> Novo kit</Button>}
      />
      {!kits ? (
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kits.map((k) => (
            <article key={k.id} onClick={() => setEditing(k)} className={`cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-tan/30 ${k.available ? "" : "opacity-60"}`}>
              <div className="relative aspect-[16/9] bg-surface-2">
                {k.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={k.image_url} alt="" className="absolute inset-0 size-full object-cover" />
                )}
                {k.badge && <span className="absolute left-3 top-3 rounded-full bg-red px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">{k.badge}</span>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{k.name}</h3>
                    <p className="text-sm text-muted">{k.items.length} itens</p>
                  </div>
                  <p className="tabular font-display text-xl font-semibold text-ink">{brl(k.price)}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-sm text-ink-2">{k.available ? "Visível no catálogo" : "Oculto"}</span>
                  <Switch checked={k.available} onChange={(v) => toggle(k, v)} label="Visível" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <KitEditor
        kit={editing}
        onClose={() => setEditing(null)}
        onSaved={(k, isNew) => {
          setKits((l) => (isNew ? [...(l ?? []), k] : l?.map((x) => (x.id === k.id ? k : x)) ?? null));
          setEditing(null);
        }}
        onDeleted={(id) => {
          setKits((l) => l?.filter((x) => x.id !== id) ?? null);
          setEditing(null);
        }}
      />
    </>
  );
}

function KitEditor({ kit, onClose, onSaved, onDeleted }: { kit: Kit | "new" | null; onClose: () => void; onSaved: (k: Kit, isNew: boolean) => void; onDeleted: (id: string) => void }) {
  const [d, setD] = useState<Partial<Kit>>({});
  const [items, setItems] = useState("");
  const [price, setPrice] = useState("");
  const [old, setOld] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!kit) return;
    const k = kit === "new" ? { name: "", tagline: "", items: [], badge: "", note: "", image_url: null, available: true } : kit;
    setD(k);
    setItems((k.items ?? []).join("\n"));
    setPrice(kit === "new" ? "" : moneyInput(kit.price));
    setOld(kit === "new" ? "" : moneyInput(kit.old_price));
  }, [kit]);

  const save = async () => {
    const p = parseMoney(price);
    const op = old.trim() ? parseMoney(old) : null;
    if (!d.name?.trim()) return toast.error("Dê um nome ao kit");
    if (!p) return toast.error("Informe o preço");
    setSaving(true);
    const row = {
      name: d.name.trim(),
      tagline: d.tagline?.trim() || null,
      items: items.split("\n").map((s) => s.trim()).filter(Boolean),
      price: p,
      old_price: op && op > p ? op : null,
      image_url: d.image_url ?? null,
      badge: d.badge?.trim() || null,
      note: d.note?.trim() || null,
      available: d.available ?? true,
    };
    const isNew = !d.id;
    const res = isNew
      ? await sb().from("kits").insert({ ...row, slug: `${slugify(row.name)}-${Math.random().toString(36).slice(2, 6)}`, sort_order: 99 }).select().single()
      : await sb().from("kits").update(row).eq("id", d.id!).select().single();
    setSaving(false);
    if (res.error) return toast.error("Não foi possível salvar", { description: res.error.message });
    revalidateCatalog();
    toast.success(isNew ? "Kit criado" : "Kit salvo");
    onSaved(toKit(res.data), isNew);
  };

  const remove = async () => {
    if (!d.id || !confirm(`Excluir o kit "${d.name}"?`)) return;
    const { error } = await sb().from("kits").delete().eq("id", d.id);
    if (error) return toast.error("Não foi possível excluir");
    revalidateCatalog();
    onDeleted(d.id);
  };

  return (
    <Sheet open={Boolean(kit)} onClose={onClose} side="right" label="Editar kit">
      <div className="border-b border-line px-5 pb-4 pt-4 md:pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-tan">{d.id ? "Editar kit" : "Novo kit"}</p>
        <h2 className="font-display mt-1 truncate pr-10 text-2xl font-semibold text-ink">{d.name || "Sem nome"}</h2>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <ImagePicker value={d.image_url ?? null} onChange={(url) => setD((x) => ({ ...x, image_url: url }))} folder="kits" aspect="aspect-[16/10]" />
        <Field label="Nome"><Input value={d.name ?? ""} onChange={(e) => setD((x) => ({ ...x, name: e.target.value }))} placeholder="Ex.: Kit Churrasco" /></Field>
        <Field label="Frase curta"><Input value={d.tagline ?? ""} onChange={(e) => setD((x) => ({ ...x, tagline: e.target.value }))} placeholder="Ex.: O churrasco de domingo, pronto" /></Field>
        <Field label="O que vem no kit" hint="Um item por linha">
          <Textarea rows={6} value={items} onChange={(e) => setItems(e.target.value)} placeholder={"1 kg Picanha\n500 g Linguiça Toscana"} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço do kit"><Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" className="tabular font-semibold" /></Field>
          <Field label="Preço “de” (opcional)" hint="Aparece riscado"><Input inputMode="decimal" value={old} onChange={(e) => setOld(e.target.value)} placeholder="—" className="tabular" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Selo"><Input value={d.badge ?? ""} onChange={(e) => setD((x) => ({ ...x, badge: e.target.value }))} placeholder="Ex.: Toda quarta" maxLength={22} /></Field>
          <Field label="Aviso"><Input value={d.note ?? ""} onChange={(e) => setD((x) => ({ ...x, note: e.target.value }))} placeholder="Ex.: Pedir com 2h" /></Field>
        </div>
        <label className="flex items-center justify-between rounded-2xl border border-line bg-bg-2/60 px-4 py-3">
          <span className="text-sm text-ink">Visível no catálogo</span>
          <Switch checked={d.available ?? true} onChange={(v) => setD((x) => ({ ...x, available: v }))} />
        </label>
      </div>
      <div className="flex gap-2 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        {d.id && <Button variant="danger" onClick={remove} aria-label="Excluir kit"><Trash2 className="size-4" /></Button>}
        <Button className="flex-1" onClick={save} loading={saving}>{d.id ? "Salvar alterações" : "Criar kit"}</Button>
      </div>
    </Sheet>
  );
}
