"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Bike, Loader2, MessageSquarePlus, ShoppingBag, Store } from "lucide-react";
import { toast } from "sonner";
import { CutDiagram } from "@/components/cut-diagram";
import { WhatsAppIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { Sheet } from "@/components/ui/sheet";
import { cartTotal, lineTotal, useCart, type CartLine } from "@/lib/cart";
import { brl, formatQty, maskPhoneInput } from "@/lib/format";
import { saveLocalOrder } from "@/lib/local-orders";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Settings } from "@/lib/types";
import { buildOrderMessage, waLink } from "@/lib/whatsapp";

const WHEN = ["O quanto antes", "Hoje à tarde", "Hoje à noite", "Amanhã de manhã", "Amanhã à tarde"];
const PAYMENTS = ["Pix", "Cartão", "Dinheiro"];

export function CartDrawer({ settings, live }: { settings: Settings; live: boolean }) {
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const lines = useCart((s) => s.lines);
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const close = () => {
    setOpen(false);
    setTimeout(() => setStep("cart"), 300);
  };

  return (
    <Sheet open={open} onClose={close} side="right" label="Seu pedido">
      <div className="flex items-center gap-3 border-b border-line px-5 pb-4 pt-4 md:pt-6">
        {step === "checkout" && (
          <button onClick={() => setStep("cart")} className="focus-ring -ml-2 grid size-10 place-items-center rounded-full text-ink-2 hover:bg-surface-3" aria-label="Voltar">
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-tan">{step === "cart" ? "Passo 1 de 2" : "Passo 2 de 2"}</p>
          <h2 className="font-display text-2xl font-semibold text-ink">{step === "cart" ? "Seu pedido" : "Seus dados"}</h2>
        </div>
      </div>
      {lines.length === 0 ? (
        <EmptyCart onClose={close} />
      ) : step === "cart" ? (
        <CartLines lines={lines} onNext={() => setStep("checkout")} />
      ) : (
        <Checkout settings={settings} live={live} onDone={close} />
      )}
    </Sheet>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <LogoMark className="h-24 w-auto opacity-20" />
      <p className="font-display mt-6 text-xl text-ink">Seu pedido está vazio</p>
      <p className="mt-2 max-w-xs text-sm text-muted">Escolha seus cortes no catálogo e toque em “+” para adicionar.</p>
      <button onClick={onClose} className="focus-ring mt-6 h-11 rounded-full border border-line-strong px-6 text-sm font-medium text-ink hover:bg-surface-3">
        Ver catálogo
      </button>
    </div>
  );
}

function LineThumb({ line }: { line: CartLine }) {
  if (line.image)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={line.image} alt="" className="size-14 shrink-0 rounded-xl border border-line object-cover" />;
  if (line.animal && line.regions?.length)
    return (
      <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-line bg-surface-2">
        <CutDiagram animal={line.animal} regions={line.regions} variant="mini" className="w-12" />
      </div>
    );
  return (
    <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-line bg-surface-2">
      <ShoppingBag className="size-5 text-muted" />
    </div>
  );
}

function CartLines({ lines, onNext }: { lines: CartLine[]; onNext: () => void }) {
  const setQty = useCart((s) => s.setQty);
  const setNotes = useCart((s) => s.setNotes);
  const [editing, setEditing] = useState<string | null>(null);
  const total = cartTotal(lines);
  const hasKg = lines.some((l) => l.unit === "kg");

  return (
    <>
      <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto px-5">
        {lines.map((l) => (
          <li key={l.key} className="py-4">
            <div className="flex gap-3">
              <LineThumb line={l} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-medium leading-snug text-ink">{l.name}</p>
                  <p className="tabular shrink-0 text-[15px] font-semibold text-ink">{brl(lineTotal(l))}</p>
                </div>
                <p className="tabular mt-0.5 text-xs text-muted">
                  {brl(l.price)}
                  {l.unit === "kg" ? "/kg" : l.unit === "un" ? "/un" : " cada"}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <QtyStepper qty={l.qty} unit={l.unit} onChange={(q) => setQty(l.key, q)} size="sm" />
                  {l.unit !== "kit" && editing !== l.key && (
                    <button onClick={() => setEditing(l.key)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
                      <MessageSquarePlus className="size-3.5" /> {l.notes ? "Editar obs." : "Observação"}
                    </button>
                  )}
                </div>
                {l.notes && editing !== l.key && <p className="mt-2 text-xs italic text-tan">“{l.notes}”</p>}
                {editing === l.key && (
                  <input
                    autoFocus
                    defaultValue={l.notes}
                    onBlur={(e) => {
                      setNotes(l.key, e.target.value.slice(0, 200));
                      setEditing(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    placeholder="Ex.: bifes finos, porções de 500 g"
                    className="focus-ring mt-2 h-10 w-full rounded-lg border border-line-strong bg-bg-2 px-3 text-sm text-ink placeholder:text-muted/70"
                  />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-line bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-2">Total estimado</span>
          <span className="tabular font-display text-[28px] font-semibold text-ink">{brl(total)}</span>
        </div>
        {hasKg && <p className="mt-1 text-xs text-muted">Itens por kg são pesados na hora; o valor final pode variar um pouco.</p>}
        <button onClick={onNext} className="focus-ring mt-4 h-14 w-full rounded-2xl bg-red text-[15px] font-semibold text-white transition hover:bg-red-bright active:scale-[.98]">
          Continuar
        </button>
      </div>
    </>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "focus-ring h-12 w-full rounded-xl border border-line-strong bg-bg-2 px-4 text-[15px] text-ink placeholder:text-muted/60";

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          onClick={() => onChange(value === o ? "" : o)}
          className={`focus-ring h-9 rounded-full border px-3.5 text-sm transition ${value === o ? "border-red bg-red/90 text-white" : "border-line-strong text-ink-2 hover:border-tan/50"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Checkout({ settings, live, onDone }: { settings: Settings; live: boolean; onDone: () => void }) {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const info = useCart((s) => s.checkout);
  const setInfo = useCart((s) => s.setCheckout);
  const clear = useCart((s) => s.clear);
  const [sending, setSending] = useState(false);
  const total = cartTotal(lines);

  const canDeliver = settings.delivery_enabled;
  const canPickup = settings.pickup_enabled;
  const fulfillment = !canDeliver ? "retirada" : !canPickup ? "entrega" : info.fulfillment;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = info.phone.replace(/\D/g, "");
    if (info.name.trim().length < 2) return toast.error("Informe seu nome.");
    if (phoneDigits.length < 10) return toast.error("Informe seu WhatsApp com DDD.");
    if (fulfillment === "entrega" && info.address.trim().length < 5) return toast.error("Informe o endereço de entrega.");

    setSending(true);
    try {
      let code: string;
      let number: number | null = null;
      if (live) {
        const { data, error } = await supabaseBrowser().rpc("place_order", {
          payload: {
            customer_name: info.name,
            customer_phone: phoneDigits,
            fulfillment,
            address: fulfillment === "entrega" ? info.address : null,
            neighborhood: fulfillment === "entrega" ? info.neighborhood : null,
            scheduled_for: info.when,
            payment_method: info.payment,
            notes: info.notes,
            items: lines.map((l) => ({ type: l.type, id: l.id, quantity: l.qty, notes: l.notes })),
          },
        });
        if (error) throw new Error(error.message);
        code = data.code;
        number = data.number;
      } else {
        code = Math.random().toString(36).slice(2, 8).toUpperCase();
      }

      const trackUrl = live ? `${window.location.origin}/pedido/${code}` : undefined;
      const message = buildOrderMessage({
        storeName: settings.store_name,
        lines,
        total,
        info: { ...info, fulfillment },
        number,
        code,
        trackUrl,
      });
      saveLocalOrder({
        code,
        number,
        message,
        whatsapp: settings.whatsapp,
        total,
        fulfillment,
        lines: lines.map((l) => ({ name: l.name, unit: l.unit, quantity: l.qty, unit_price: l.price, line_total: lineTotal(l), notes: l.notes || null })),
        created_at: new Date().toISOString(),
      });

      // Desktop: abre o WhatsApp em nova aba já no clique; mobile: a página do pedido redireciona
      const isDesktop = window.matchMedia("(pointer: fine)").matches;
      if (isDesktop) window.open(waLink(settings.whatsapp, message), "_blank", "noopener");

      clear();
      onDone();
      router.push(`/pedido/${code}?novo=1${isDesktop ? "&aberto=1" : ""}`);
    } catch (err) {
      toast.error("Não foi possível registrar o pedido", {
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <Field label="Seu nome">
          <input className={inputCls} value={info.name} onChange={(e) => setInfo({ name: e.target.value })} placeholder="Como podemos te chamar?" autoComplete="name" />
        </Field>
        <Field label="WhatsApp" hint="Usamos só para falar sobre este pedido.">
          <input
            className={inputCls}
            value={info.phone}
            onChange={(e) => setInfo({ phone: maskPhoneInput(e.target.value) })}
            placeholder="(41) 99999-9999"
            inputMode="tel"
            autoComplete="tel-national"
          />
        </Field>

        {canDeliver && canPickup && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink">Como você quer receber?</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "retirada" as const, label: "Retirar na loja", icon: Store },
                { id: "entrega" as const, label: "Entrega", icon: Bike },
              ].map((o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => setInfo({ fulfillment: o.id })}
                  className={`focus-ring flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border text-sm font-medium transition ${
                    fulfillment === o.id ? "border-red bg-red/10 text-ink" : "border-line-strong text-ink-2 hover:border-tan/40"
                  }`}
                >
                  <o.icon className={`size-5 ${fulfillment === o.id ? "text-red-bright" : ""}`} />
                  {o.label}
                </button>
              ))}
            </div>
            {fulfillment === "retirada" && settings.address && <p className="mt-2 text-xs text-muted">Retirada em {settings.address}</p>}
          </div>
        )}

        {fulfillment === "entrega" && (
          <div className="space-y-3 rounded-2xl border border-line bg-bg-2/60 p-4">
            <Field label="Endereço">
              <input className={inputCls} value={info.address} onChange={(e) => setInfo({ address: e.target.value })} placeholder="Rua, número, complemento" autoComplete="street-address" />
            </Field>
            <Field label="Bairro">
              <input className={inputCls} value={info.neighborhood} onChange={(e) => setInfo({ neighborhood: e.target.value })} placeholder="Ex.: Portão" />
            </Field>
            {settings.delivery_note && <p className="text-xs text-tan">{settings.delivery_note}</p>}
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Para quando?</span>
          <Chips options={WHEN} value={info.when} onChange={(v) => setInfo({ when: v })} />
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Pagamento</span>
          <Chips options={PAYMENTS} value={info.payment} onChange={(v) => setInfo({ payment: v })} />
        </div>
        <Field label="Observações (opcional)">
          <textarea
            className="focus-ring w-full resize-none rounded-xl border border-line-strong bg-bg-2 px-4 py-3 text-[15px] text-ink placeholder:text-muted/60"
            rows={2}
            value={info.notes}
            onChange={(e) => setInfo({ notes: e.target.value.slice(0, 500) })}
            placeholder="Algo mais que a gente precise saber?"
          />
        </Field>

        <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Resumo</p>
          <ul className="space-y-1">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3 text-sm text-ink-2">
                <span className="truncate">
                  <span className="tabular text-ink">{formatQty(l.qty, l.unit)}</span> · {l.name}
                </span>
                <span className="tabular shrink-0">{brl(lineTotal(l))}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm text-ink-2">Total estimado</span>
          <span className="tabular font-display text-2xl font-semibold text-ink">{brl(total)}</span>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="focus-ring flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1fa855] text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(31,168,85,.8)] transition hover:bg-[#23bd60] active:scale-[.98] disabled:opacity-70"
        >
          {sending ? <Loader2 className="size-5 animate-spin" /> : <WhatsAppIcon className="size-5" />}
          {sending ? "Registrando pedido…" : "Enviar pedido pelo WhatsApp"}
        </button>
        <p className="mt-2 text-center text-[11px] text-muted">Você confirma os detalhes direto com a loja no WhatsApp.</p>
      </div>
    </form>
  );
}
