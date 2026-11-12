"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bike, CalendarClock, Copy, CreditCard, MapPin, MessageSquareText, Phone, Search, Store, X } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { sb } from "@/lib/admin";
import { brl, dateTime, formatPhone, formatQty, STATUS_LABEL, timeAgo } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";
import { useAdmin } from "./shell";
import { Button, Input, PageHeader, Skeleton, Textarea } from "./ui";

const OPEN: OrderStatus[] = ["novo", "confirmado", "separando", "pronto", "em_rota"];
const COLUMNS: { id: string; label: string; statuses: OrderStatus[]; tone: string }[] = [
  { id: "novo", label: "Novos", statuses: ["novo"], tone: "bg-red-bright" },
  { id: "confirmado", label: "Confirmados", statuses: ["confirmado"], tone: "bg-warn" },
  { id: "separando", label: "Separando", statuses: ["separando"], tone: "bg-tan" },
  { id: "pronto", label: "Prontos / em rota", statuses: ["pronto", "em_rota"], tone: "bg-ok" },
];

const STATUS_TONE: Record<OrderStatus, string> = {
  novo: "bg-red/20 text-red-bright border-red/40",
  confirmado: "bg-warn/15 text-warn border-warn/40",
  separando: "bg-tan/15 text-tan border-tan/40",
  pronto: "bg-ok/15 text-ok border-ok/40",
  em_rota: "bg-ok/15 text-ok border-ok/40",
  concluido: "bg-surface-3 text-ink-2 border-line-strong",
  cancelado: "bg-surface-3 text-muted border-line-strong line-through",
};

function nextStep(o: Order): { status: OrderStatus; label: string } | null {
  switch (o.status) {
    case "novo": return { status: "confirmado", label: "Confirmar pedido" };
    case "confirmado": return { status: "separando", label: "Começar a separar" };
    case "separando": return o.fulfillment === "entrega" ? { status: "em_rota", label: "Saiu para entrega" } : { status: "pronto", label: "Pronto para retirada" };
    case "pronto":
    case "em_rota": return { status: "concluido", label: o.fulfillment === "entrega" ? "Marcar como entregue" : "Marcar como retirado" };
    default: return null;
  }
}

const customerWa = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length <= 11 ? `55${d}` : d;
};

function templateFor(o: Order, status: OrderStatus, address: string | null) {
  const first = o.customer_name.split(" ")[0];
  const track = `${window.location.origin}/pedido/${o.code}`;
  const t: Partial<Record<OrderStatus, string>> = {
    confirmado: `Olá, ${first}! Seu pedido #${o.number} foi confirmado ✅ Já vamos separar seus cortes.\n\nAcompanhe: ${track}`,
    separando: `Olá, ${first}! Estamos separando seu pedido #${o.number} agora 🔪\n\nAcompanhe: ${track}`,
    pronto: `Olá, ${first}! Seu pedido #${o.number} está pronto para retirada${address ? ` na ${address.split("—")[0].trim()}` : ""}. Te esperamos! 🥩`,
    em_rota: `Olá, ${first}! Seu pedido #${o.number} saiu para entrega 🛵\n\nAcompanhe: ${track}`,
    concluido: `Obrigado pela preferência, ${first}! Bom apetite e até a próxima 🔥`,
  };
  return t[status] ?? `Olá, ${first}! Sobre seu pedido #${o.number}:`;
}

export function OrdersPage() {
  const { lastEvent, refreshCount } = useAdmin();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState<"abertos" | "concluido" | "cancelado">("abertos");
  const [mobileCol, setMobileCol] = useState("novo");
  const [query, setQuery] = useState("");
  const [days, setDays] = useState(7);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [storeAddress, setStoreAddress] = useState<string | null>(null);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - Math.max(days, 2) * 86400000).toISOString();
    let q = sb().from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(300);
    q = tab === "abertos" ? q.in("status", OPEN) : q.eq("status", tab).gte("created_at", since);
    const { data, error } = await q;
    if (error) return toast.error("Erro ao carregar pedidos", { description: error.message });
    setOrders(
      (data as Order[]).map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        order_items: (o.order_items ?? []).sort((a, b) => ((a as { sort?: number }).sort ?? 0) - ((b as { sort?: number }).sort ?? 0)),
      }))
    );
  }, [tab, days]);

  useEffect(() => {
    load();
  }, [load, lastEvent]);

  useEffect(() => {
    sb().from("settings").select("address").eq("id", 1).maybeSingle().then(({ data }) => setStoreAddress(data?.address ?? null));
  }, []);

  // Indicadores do dia
  const [today, setToday] = useState<{ count: number; total: number } | null>(null);
  useEffect(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    sb()
      .from("orders")
      .select("subtotal,status")
      .gte("created_at", start.toISOString())
      .neq("status", "cancelado")
      .then(({ data }) => setToday({ count: data?.length ?? 0, total: (data ?? []).reduce((s, o) => s + Number(o.subtotal), 0) }));
  }, [lastEvent, orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!orders) return [];
    if (!q) return orders;
    return orders.filter((o) => `${o.number} ${o.code} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(q.replace(/\D/g, "") || q));
  }, [orders, query]);

  const selected = orders?.find((o) => o.id === selectedId) ?? null;

  const updateOrder = async (o: Order, patch: Partial<Order>) => {
    setOrders((list) => list?.map((x) => (x.id === o.id ? { ...x, ...patch } : x)) ?? null);
    const { error } = await sb().from("orders").update(patch).eq("id", o.id);
    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      load();
      return false;
    }
    refreshCount();
    return true;
  };

  const advance = async (o: Order, status: OrderStatus) => {
    const ok = await updateOrder(o, { status });
    if (!ok) return;
    toast.success(`Pedido #${o.number}: ${STATUS_LABEL[status]}`, {
      action: { label: "Avisar no WhatsApp", onClick: () => window.open(waLink(customerWa(o.customer_phone), templateFor(o, status, storeAddress)), "_blank") },
      duration: 8000,
    });
    if (!OPEN.includes(status) && tab === "abertos") setTimeout(load, 400);
  };

  const openCount = (statuses: OrderStatus[]) => filtered.filter((o) => statuses.includes(o.status)).length;

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle={today ? `Hoje: ${today.count} ${today.count === 1 ? "pedido" : "pedidos"} · ${brl(today.total)} estimado` : " "}
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 rounded-2xl border border-line bg-surface p-1">
          {[
            { id: "abertos" as const, label: "Em aberto" },
            { id: "concluido" as const, label: "Concluídos" },
            { id: "cancelado" as const, label: "Cancelados" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setOrders(null);
                setTab(t.id);
              }}
              className={`h-9 flex-1 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition md:flex-none md:px-4 ${tab === t.id ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab !== "abertos" && (
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="focus-ring h-11 rounded-xl border border-line-strong bg-bg-2 px-3 text-sm text-ink">
              <option value={1}>Hoje</option>
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={365}>12 meses</option>
            </select>
          )}
          <div className="relative flex-1 md:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, telefone ou nº" className="pl-10" />
          </div>
        </div>
      </div>

      {!orders ? (
        <div className="grid gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : tab === "abertos" ? (
        <>
          {/* Mobile: escolhe a coluna */}
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
            {COLUMNS.map((c) => (
              <button
                key={c.id}
                onClick={() => setMobileCol(c.id)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition ${mobileCol === c.id ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2"}`}
              >
                <span className={`size-2 rounded-full ${c.tone}`} /> {c.label}
                <span className="tabular text-xs opacity-60">{openCount(c.statuses)}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {COLUMNS.map((c) => {
              const list = filtered.filter((o) => c.statuses.includes(o.status)).sort((a, b) => a.created_at.localeCompare(b.created_at));
              return (
                <section key={c.id} className={`${mobileCol === c.id ? "" : "hidden"} lg:block`}>
                  <header className="mb-3 hidden items-center gap-2 px-1 lg:flex">
                    <span className={`size-2 rounded-full ${c.tone}`} />
                    <h2 className="text-sm font-semibold text-ink">{c.label}</h2>
                    <span className="tabular text-xs text-muted">{list.length}</span>
                  </header>
                  <div className="space-y-3 lg:min-h-[50vh] lg:rounded-2xl lg:bg-bg-2/60 lg:p-2">
                    {list.length === 0 && <p className="px-2 py-10 text-center text-sm text-muted">Nenhum pedido aqui.</p>}
                    {list.map((o) => (
                      <OrderCard key={o.id} order={o} onOpen={() => setSelectedId(o.id)} onAdvance={advance} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">Nenhum pedido neste período.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} onOpen={() => setSelectedId(o.id)} onAdvance={advance} />
          ))}
        </div>
      )}

      <OrderDetail order={selected} onClose={() => setSelectedId(null)} onAdvance={advance} onUpdate={updateOrder} storeAddress={storeAddress} />
    </>
  );
}

function OrderCard({ order: o, onOpen, onAdvance }: { order: Order; onOpen: () => void; onAdvance: (o: Order, s: OrderStatus) => void }) {
  const next = nextStep(o);
  const items = o.order_items ?? [];
  const fresh = o.status === "novo" && Date.now() - new Date(o.created_at).getTime() < 15 * 60000;
  return (
    <article
      onClick={onOpen}
      className={`cursor-pointer rounded-2xl border bg-surface p-4 transition hover:border-tan/30 ${fresh ? "border-red/60 shadow-[0_0_0_3px_rgba(179,32,27,.12)]" : "border-line"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="tabular font-display text-xl font-semibold leading-none text-ink">#{o.number}</p>
          <p className="mt-1.5 text-[15px] font-medium text-ink">{o.customer_name}</p>
        </div>
        <div className="text-right">
          <p className="tabular text-[15px] font-semibold text-ink">{brl(o.subtotal)}</p>
          <p className="mt-1 text-xs text-muted">{timeAgo(o.created_at)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-1 text-ink-2">
          {o.fulfillment === "entrega" ? <Bike className="size-3" /> : <Store className="size-3" />}
          {o.fulfillment === "entrega" ? o.neighborhood || "Entrega" : "Retirada"}
        </span>
        {o.scheduled_for && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-1 text-ink-2">
            <CalendarClock className="size-3" /> {o.scheduled_for}
          </span>
        )}
        {!OPEN.includes(o.status) && <span className={`rounded-full border px-2 py-0.5 ${STATUS_TONE[o.status]}`}>{STATUS_LABEL[o.status]}</span>}
        {o.status === "em_rota" && <span className={`rounded-full border px-2 py-0.5 ${STATUS_TONE[o.status]}`}>Em rota</span>}
      </div>
      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">
        {items.map((i) => `${formatQty(Number(i.quantity), i.unit)} ${i.name}`).join(" · ")}
      </p>
      {next && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdvance(o, next.status);
          }}
          className={`focus-ring mt-3 h-10 w-full rounded-xl text-sm font-semibold transition active:scale-[.98] ${o.status === "novo" ? "bg-red text-white hover:bg-red-bright" : "border border-line-strong bg-surface-2 text-ink hover:bg-surface-3"}`}
        >
          {next.label}
        </button>
      )}
    </article>
  );
}

function OrderDetail({
  order: o,
  onClose,
  onAdvance,
  onUpdate,
  storeAddress,
}: {
  order: Order | null;
  onClose: () => void;
  onAdvance: (o: Order, s: OrderStatus) => void;
  onUpdate: (o: Order, patch: Partial<Order>) => Promise<boolean>;
  storeAddress: string | null;
}) {
  const next = o ? nextStep(o) : null;
  return (
    <Sheet open={Boolean(o)} onClose={onClose} side="right" label="Pedido">
      {o && (
        <>
          <div className="border-b border-line px-5 pb-4 pt-4 md:pt-6">
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              <span className="text-xs text-muted">{dateTime(o.created_at)}</span>
            </div>
            <h2 className="tabular font-display mt-2 text-3xl font-semibold text-ink">Pedido #{o.number}</h2>
          </div>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <section className="rounded-2xl border border-line bg-bg-2/60 p-4">
              <p className="text-lg font-medium text-ink">{o.customer_name}</p>
              <a href={`tel:${o.customer_phone}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
                <Phone className="size-3.5" /> {formatPhone(o.customer_phone)}
              </a>
              <div className="mt-3 space-y-1.5 text-sm text-ink-2">
                <p className="flex items-start gap-2">
                  {o.fulfillment === "entrega" ? <MapPin className="mt-0.5 size-4 shrink-0 text-red-bright" /> : <Store className="mt-0.5 size-4 shrink-0 text-red-bright" />}
                  {o.fulfillment === "entrega" ? `${o.address ?? ""}${o.neighborhood ? ` — ${o.neighborhood}` : ""}` : "Retirada na loja"}
                </p>
                {o.scheduled_for && <p className="flex items-center gap-2"><CalendarClock className="size-4 text-muted" /> {o.scheduled_for}</p>}
                {o.payment_method && <p className="flex items-center gap-2"><CreditCard className="size-4 text-muted" /> {o.payment_method}</p>}
                {o.notes && <p className="flex items-start gap-2"><MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted" /> {o.notes}</p>}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={waLink(customerWa(o.customer_phone), templateFor(o, next?.status ?? o.status, storeAddress))}
                  target="_blank"
                  rel="noopener"
                  className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1fa855] text-sm font-semibold text-white"
                >
                  <WhatsAppIcon className="size-4" /> WhatsApp
                </a>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/pedido/${o.code}`);
                    toast.success("Link de acompanhamento copiado");
                  }}
                >
                  <Copy className="size-4" /> Link do pedido
                </Button>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Itens</h3>
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {(o.order_items ?? []).map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-[15px] text-ink">
                        <span className="tabular font-semibold">{formatQty(Number(i.quantity), i.unit)}</span> · {i.name}
                      </p>
                      {i.notes && <p className="mt-0.5 text-sm italic text-tan">“{i.notes}”</p>}
                    </div>
                    <span className="tabular shrink-0 text-sm text-ink-2">{brl(Number(i.line_total))}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-baseline justify-between px-1">
                <span className="text-sm text-ink-2">Total estimado</span>
                <span className="tabular font-display text-2xl font-semibold text-ink">{brl(o.subtotal)}</span>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Anotações internas</h3>
              <Textarea
                key={o.id}
                rows={3}
                defaultValue={o.admin_notes ?? ""}
                placeholder="Ex.: peso final 1,62 kg · total R$ 179,80 · pago no Pix"
                onBlur={async (e) => {
                  if ((e.target.value || null) !== o.admin_notes) {
                    if (await onUpdate(o, { admin_notes: e.target.value || null })) toast.success("Anotação salva");
                  }
                }}
              />
            </section>

            {o.status_history?.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Histórico</h3>
                <ol className="space-y-1 text-sm text-ink-2">
                  {o.status_history.map((h, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{STATUS_LABEL[h.status]}</span>
                      <span className="tabular text-muted">{dateTime(h.at)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
          <div className="flex gap-2 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            {o.status !== "cancelado" && o.status !== "concluido" && (
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm(`Cancelar o pedido #${o.number}?`)) onAdvance(o, "cancelado");
                }}
              >
                <X className="size-4" /> Cancelar
              </Button>
            )}
            {(o.status === "cancelado" || o.status === "concluido") && (
              <Button variant="secondary" onClick={() => onAdvance(o, "novo")}>Reabrir pedido</Button>
            )}
            {next && (
              <Button className="flex-1" onClick={() => onAdvance(o, next.status)}>
                {next.label}
              </Button>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
