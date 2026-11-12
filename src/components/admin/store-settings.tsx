"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { revalidateCatalog, sb } from "@/lib/admin";
import { DAY_SHORT } from "@/lib/hours";
import type { Settings } from "@/lib/types";
import { Button, Field, Input, PageHeader, Skeleton, Switch, Textarea } from "./ui";

export function StoreSettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    sb().from("settings").select("*").eq("id", 1).single().then(({ data }) => setS(data as Settings));
  }, []);

  const set = (patch: Partial<Settings>) => {
    setS((x) => (x ? { ...x, ...patch } : x));
    setDirty(true);
  };

  const save = async () => {
    if (!s) return;
    const wa = s.whatsapp.replace(/\D/g, "");
    if (wa.length < 12) return toast.error("WhatsApp precisa ter código do país e DDD, ex.: 5541996752749");
    setSaving(true);
    const { id: _id, ...rest } = s as Settings & { id?: number; updated_at?: string };
    delete (rest as { updated_at?: string }).updated_at;
    const { error } = await sb().from("settings").update({ ...rest, whatsapp: wa }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar", { description: error.message });
    revalidateCatalog();
    setDirty(false);
    toast.success("Configurações salvas");
  };

  if (!s) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  const setHour = (i: number, patch: Partial<Settings["hours"][number]>) => set({ hours: s.hours.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Loja" subtitle="Informações que aparecem no catálogo e na mensagem do WhatsApp" />
      <div className="space-y-6">
        <Card title="Aviso no topo do catálogo">
          <Textarea rows={2} value={s.announcement ?? ""} onChange={(e) => set({ announcement: e.target.value })} placeholder="Ex.: Feriado: abriremos das 9h às 13h" />
          <p className="mt-1 text-xs text-muted">Deixe em branco para esconder a faixa.</p>
        </Card>

        <Card title="Recebimento">
          <Row label="Retirada na loja" desc="Cliente busca no endereço da loja">
            <Switch checked={s.pickup_enabled} onChange={(v) => set({ pickup_enabled: v })} />
          </Row>
          <Row label="Entrega" desc="Cliente informa endereço no pedido">
            <Switch checked={s.delivery_enabled} onChange={(v) => set({ delivery_enabled: v })} />
          </Row>
          <Field label="Observação sobre entrega" className="mt-3">
            <Input value={s.delivery_note ?? ""} onChange={(e) => set({ delivery_note: e.target.value })} />
          </Field>
        </Card>

        <Card title="Horário de funcionamento">
          <div className="space-y-3">
            {s.hours.map((h, i) => (
              <div key={i} className="rounded-xl border border-line bg-bg-2/60 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {DAY_SHORT.map((d, di) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setHour(i, { days: h.days.includes(di) ? h.days.filter((x) => x !== di) : [...h.days, di].sort() })}
                      className={`h-8 w-11 rounded-lg text-xs font-medium ${h.days.includes(di) ? "bg-ink text-bg" : "border border-line-strong text-muted"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Input type="time" value={h.open} onChange={(e) => setHour(i, { open: e.target.value })} className="w-32" />
                  <span className="text-muted">até</span>
                  <Input type="time" value={h.close} onChange={(e) => setHour(i, { close: e.target.value })} className="w-32" />
                  <button onClick={() => set({ hours: s.hours.filter((_, idx) => idx !== i) })} className="ml-auto grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-3 hover:text-ink" aria-label="Remover horário">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => set({ hours: [...s.hours, { days: [0], open: "09:00", close: "13:00" }] })}>
              <Plus className="size-4" /> Adicionar horário
            </Button>
          </div>
        </Card>

        <Card title="Contato">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="WhatsApp que recebe os pedidos" hint="Com 55 e DDD, só números">
              <Input value={s.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} inputMode="numeric" />
            </Field>
            <Field label="Telefone exibido">
              <Input value={s.phone_display ?? ""} onChange={(e) => set({ phone_display: e.target.value })} />
            </Field>
            <Field label="Instagram (sem @)">
              <Input value={s.instagram ?? ""} onChange={(e) => set({ instagram: e.target.value })} />
            </Field>
            <Field label="Endereço">
              <Input value={s.address ?? ""} onChange={(e) => set({ address: e.target.value })} />
            </Field>
            <Field label="Link do Google Maps" className="md:col-span-2">
              <Input value={s.maps_url ?? ""} onChange={(e) => set({ maps_url: e.target.value })} />
            </Field>
          </div>
        </Card>
      </div>
      <div className="sticky bottom-20 z-10 mt-6 flex justify-end md:bottom-6">
        <Button onClick={save} loading={saving} disabled={!dirty} className="shadow-xl shadow-black/50">
          {dirty ? "Salvar alterações" : "Tudo salvo"}
        </Button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-tan">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 first:pt-0 last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      {children}
    </div>
  );
}
