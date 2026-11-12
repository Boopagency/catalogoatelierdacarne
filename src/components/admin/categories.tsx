"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { revalidateCatalog, sb } from "@/lib/admin";
import type { Animal } from "@/lib/anatomy";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";
import { Button, Field, ImagePicker, Input, PageHeader, Select, Skeleton, Switch } from "./ui";

export function CategoriesPage() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([sb().from("categories").select("*").order("sort_order"), sb().from("products").select("category_id")]);
    setCats((c.data ?? []) as Category[]);
    const cnt: Record<string, number> = {};
    (p.data ?? []).forEach((r) => (cnt[r.category_id] = (cnt[r.category_id] ?? 0) + 1));
    setCounts(cnt);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const move = async (i: number, dir: -1 | 1) => {
    if (!cats) return;
    const list = [...cats];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const ordered = list.map((c, idx) => ({ ...c, sort_order: idx }));
    setCats(ordered);
    await Promise.all(ordered.map((c) => sb().from("categories").update({ sort_order: c.sort_order }).eq("id", c.id)));
    revalidateCatalog();
  };

  const toggle = async (c: Category, active: boolean) => {
    setCats((l) => l?.map((x) => (x.id === c.id ? { ...x, active } : x)) ?? null);
    await sb().from("categories").update({ active }).eq("id", c.id);
    revalidateCatalog();
    toast.success(active ? `${c.name} visível` : `${c.name} oculta do catálogo`);
  };

  return (
    <>
      <PageHeader title="Categorias" subtitle="A ordem aqui é a ordem do catálogo" actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> Nova categoria</Button>} />
      {!cats ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {cats.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 px-3 py-3 md:px-4">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-3 hover:text-ink disabled:opacity-20" aria-label="Subir"><ArrowUp className="size-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-3 hover:text-ink disabled:opacity-20" aria-label="Descer"><ArrowDown className="size-4" /></button>
              </div>
              <button onClick={() => setEditing(c)} className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {c.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.cover_url} alt="" className="absolute inset-0 size-full object-cover" />
                )}
              </button>
              <button onClick={() => setEditing(c)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-[15px] font-medium text-ink">{c.name}</p>
                <p className="truncate text-xs text-muted">{counts[c.id] ?? 0} produtos · {c.subtitle}</p>
              </button>
              <Switch checked={c.active} onChange={(v) => toggle(c, v)} label="Visível" />
            </div>
          ))}
        </div>
      )}
      <CategoryEditor
        category={editing}
        count={editing && editing !== "new" ? counts[editing.id] ?? 0 : 0}
        onClose={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          load();
        }}
      />
    </>
  );
}

function CategoryEditor({ category, count, onClose, onDone }: { category: Category | "new" | null; count: number; onClose: () => void; onDone: () => void }) {
  const [d, setD] = useState<Partial<Category>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (category) setD(category === "new" ? { name: "", subtitle: "", animal: null, cover_url: null, active: true } : category);
  }, [category]);

  const save = async () => {
    if (!d.name?.trim()) return toast.error("Dê um nome à categoria");
    setSaving(true);
    const row = { name: d.name.trim(), subtitle: d.subtitle?.trim() || null, animal: d.animal ?? null, cover_url: d.cover_url ?? null, active: d.active ?? true };
    const res = d.id
      ? await sb().from("categories").update(row).eq("id", d.id)
      : await sb().from("categories").insert({ ...row, slug: `${slugify(row.name)}-${Math.random().toString(36).slice(2, 5)}`, sort_order: 99 });
    setSaving(false);
    if (res.error) return toast.error("Não foi possível salvar", { description: res.error.message });
    revalidateCatalog();
    toast.success("Categoria salva");
    onDone();
  };

  const remove = async () => {
    if (!d.id) return;
    if (count > 0) return toast.error("Mova ou exclua os produtos desta categoria antes");
    if (!confirm(`Excluir a categoria "${d.name}"?`)) return;
    const { error } = await sb().from("categories").delete().eq("id", d.id);
    if (error) return toast.error("Não foi possível excluir", { description: error.message });
    revalidateCatalog();
    onDone();
  };

  return (
    <Sheet open={Boolean(category)} onClose={onClose} side="right" label="Editar categoria">
      <div className="border-b border-line px-5 pb-4 pt-4 md:pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-tan">{d.id ? "Editar categoria" : "Nova categoria"}</p>
        <h2 className="font-display mt-1 truncate pr-10 text-2xl font-semibold text-ink">{d.name || "Sem nome"}</h2>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <ImagePicker label="Foto de capa" value={d.cover_url ?? null} onChange={(url) => setD((x) => ({ ...x, cover_url: url }))} folder="categorias" aspect="aspect-[21/9]" />
        <Field label="Nome"><Input value={d.name ?? ""} onChange={(e) => setD((x) => ({ ...x, name: e.target.value }))} /></Field>
        <Field label="Subtítulo"><Input value={d.subtitle ?? ""} onChange={(e) => setD((x) => ({ ...x, subtitle: e.target.value }))} placeholder="Ex.: Cortes nobres para a grelha" /></Field>
        <Field label="Animal padrão" hint="Novos produtos desta categoria já começam com este mapa de cortes">
          <Select value={d.animal ?? ""} onChange={(e) => setD((x) => ({ ...x, animal: (e.target.value || null) as Animal | null }))}>
            <option value="">Nenhum</option>
            <option value="bovino">Boi</option>
            <option value="suino">Porco</option>
            <option value="frango">Frango</option>
          </Select>
        </Field>
      </div>
      <div className="flex gap-2 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        {d.id && <Button variant="danger" onClick={remove} aria-label="Excluir categoria"><Trash2 className="size-4" /></Button>}
        <Button className="flex-1" onClick={save} loading={saving}>{d.id ? "Salvar" : "Criar categoria"}</Button>
      </div>
    </Sheet>
  );
}
