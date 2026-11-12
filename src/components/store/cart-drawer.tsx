"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
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

const WHEN = ["O quanto antes", "Hoje à tarde", "Hoje à noite", "Amanhã cedo", "Amanhã à tarde"];
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
      <div className="flex h-12 items-stretch border-b border-line-strong pr-12">
        {step === "checkout" ? (
          <button onClick={() => setStep("cart")} className="sign flex items-center gap-2 border-r border-line px-4 text-[15px] font-bold text-ink-2 hover:text-ink" aria-label="Voltar">
            <ArrowLeft className="size-4" /> Voltar
          </button>
        ) : null}
        <p className="sign flex items-center gap-3 px-5 text-[15px] font-bold text-muted">
          <span className={step === "cart" ? "text-ink" : ""}>1 Pedido</span>
          <span className="h-px w-5 bg-line-strong" />
          <span className={step === "checkout" ? "text-ink" : ""}>2 Seus dados</span>
        </p>
      </div>
      <div className="px-5 pb-4 pt-6">
        <h2 className="sign text-[52px] font-extralight leading-[0.85] text-ink">{step === "cart" ? "Seu pedido" : "Seus dados"}</h2>
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
    <div className="flex flex-1 flex-col items-start justify-center border-t border-line px-5 py-16">
      <LogoMark className="h-20 w-auto opacity-25" />
      <p className="sign mt-8 text-[28px] font-bold text-ink">Nada por aqui ainda.</p>
      <p className="mt-2 max-w-xs text-[15px] italic text-muted">Escolha seus cortes no catálogo e toque em + para separar.</p>
      <button onClick={onClose} className="sign focus-ring mt-8 h-12 border border-ink px-6 text-[16px] font-bold text-ink hover:bg-ink hover:text-bg">
        Ver catálogo
      </button>
    </div>
  );
}

function LineThumb({ line }: { line: CartLine }) {
  if (line.image)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={line.image} alt="" className="size-14 shrink-0 border border-line object-cover" />;
  if (line.animal && line.regions?.length)
    return (
      <div className="grid size-14 shrink-0 place-items-center border border-line">
        <CutDiagram animal={line.animal} regions={line.regions} variant="mini" className="w-12" />
      </div>
    );
  return <div className="size-14 shrink-0 border border-line bg-surface" />;
}

function CartLines({ lines, onNext }: { lines: CartLine[]; onNext: () => void }) {
  const setQty = useCart((s) => s.setQty);
  const setNotes = useCart((s) => s.setNotes);
  const [editing, setEditing] = useState<string | null>(null);
  const total = cartTotal(lines);
  const hasKg = lines.some((l) => l.unit === "kg");

  return (
    <>
      <ul className="min-h-0 flex-1 overflow-y-auto border-t border-line-strong px-5">
        {lines.map((l) => (
          <li key={l.key} className="border-b border-line py-4">
            <div className="flex gap-3">
              <LineThumb line={l} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="sign text-[19px] font-bold leading-tight text-ink">{l.name}</p>
                  <p className="sign tabular shrink-0 text-[19px] font-extrabold text-ink">{brl(lineTotal(l))}</p>
                </div>
                <p className="sign tabular mt-0.5 text-[13px] font-medium text-muted">
                  {brl(l.price)}
                  {l.unit === "kg" ? " o quilo" : l.unit === "un" ? " a unidade" : " cada"}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <QtyStepper qty={l.qty} unit={l.unit} onChange={(q) => setQty(l.key, q)} size="sm" />
                  {l.unit !== "kit" && editing !== l.key && (
                    <button onClick={() => setEditing(l.key)} className="text-[13px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink">
                      {l.notes ? "editar observação" : "+ observação"}
                    </button>
                  )}
                </div>
                {l.notes && editing !== l.key && <p className="mt-2 border-l-2 border-tan pl-2 text-[14px] italic text-tan">{l.notes}</p>}
                {editing === l.key && (
                  <input
                    autoFocus
                    defaultValue={l.notes}
                    onBlur={(e) => {
                      setNotes(l.key, e.target.value.slice(0, 200));
                      setEditing(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    placeholder="Bifes finos, porções de 500 g..."
                    className="mt-2 h-10 w-full border-b border-line-strong bg-transparent text-[15px] text-ink placeholder:italic placeholder:text-muted/70 focus:border-tan focus:outline-none"
                  />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-line-strong bg-bg px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-end justify-between border-b-4 border-double border-line-strong pb-3">
          <span className="sign text-[16px] font-bold text-ink-2">Total estimado</span>
          <span className="sign tabular text-[36px] font-extrabold leading-none text-ink">{brl(total)}</span>
        </div>
        {hasKg && <p className="mt-2 text-[13px] italic text-muted">Itens por quilo são pesados na hora; o valor final pode variar um pouco.</p>}
        <button onClick={onNext} className="sign focus-ring mt-4 h-14 w-full bg-red text-[18px] font-extrabold text-white transition hover:bg-red-bright">
          Continuar
        </button>
      </div>
    </>
  );
}

const underline =
  "h-11 w-full border-b border-line-strong bg-transparent text-[17px] text-ink placeholder:italic placeholder:text-muted/60 focus:border-tan focus:outline-none";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="sign block text-[14px] font-bold text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[13px] italic text-muted">{hint}</span>}
    </label>
  );
}

function Boxes({ options, value, onChange, cols }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void; cols?: string }) {
  return (
    <div className={`grid border border-line-strong ${cols ?? "grid-cols-2"}`}>
      {options.map((o, i) => (
        <button
          type="button"
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`sign focus-ring min-h-11 px-2 py-2 text-[15px] font-bold transition ${i > 0 ? "border-l border-line-strong" : ""} ${value === o.id ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2"}`}
        >
          {o.label}
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
      const message = buildOrderMessage({ storeName: settings.store_name, lines, total, info: { ...info, fulfillment }, number, code, trackUrl });
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

      // Desktop abre o WhatsApp em nova aba no próprio clique; no celular a página do pedido redireciona
      const isDesktop = window.matchMedia("(pointer: fine)").matches;
      if (isDesktop) window.open(waLink(settings.whatsapp, message), "_blank", "noopener");

      clear();
      onDone();
      router.push(`/pedido/${code}?novo=1${isDesktop ? "&aberto=1" : ""}`);
    } catch (err) {
      toast.error(`Não foi possível registrar o pedido. ${err instanceof Error ? err.message : "Tente de novo."}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col border-t border-line-strong">
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-6">
        <Field label="Nome">
          <input className={underline} value={info.name} onChange={(e) => setInfo({ name: e.target.value })} placeholder="Como podemos te chamar" autoComplete="name" />
        </Field>
        <Field label="WhatsApp" hint="Só para falar sobre este pedido.">
          <input className={underline} value={info.phone} onChange={(e) => setInfo({ phone: maskPhoneInput(e.target.value) })} placeholder="(41) 99999-9999" inputMode="tel" autoComplete="tel-national" />
        </Field>

        {canDeliver && canPickup && (
          <div>
            <span className="sign mb-2 block text-[14px] font-bold text-ink-2">Recebimento</span>
            <Boxes
              options={[
                { id: "retirada", label: "Retirar na loja" },
                { id: "entrega", label: "Entrega" },
              ]}
              value={fulfillment}
              onChange={(v) => setInfo({ fulfillment: v as "retirada" | "entrega" })}
            />
            {fulfillment === "retirada" && settings.address && (
              <p className="mt-2 text-[13px] italic text-muted">Retirada em {settings.address}</p>
            )}
          </div>
        )}

        {fulfillment === "entrega" && (
          <div className="space-y-6 border-l-2 border-red pl-4">
            <Field label="Endereço">
              <input className={underline} value={info.address} onChange={(e) => setInfo({ address: e.target.value })} placeholder="Rua, número, complemento" autoComplete="street-address" />
            </Field>
            <Field label="Bairro">
              <input className={underline} value={info.neighborhood} onChange={(e) => setInfo({ neighborhood: e.target.value })} placeholder="Portão" />
            </Field>
            {settings.delivery_note && <p className="text-[13px] italic text-tan">{settings.delivery_note}</p>}
          </div>
        )}

        <div>
          <span className="sign mb-2 block text-[14px] font-bold text-ink-2">Para quando</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {WHEN.map((w) => (
              <button
                type="button"
                key={w}
                onClick={() => setInfo({ when: info.when === w ? "" : w })}
                className={`sign text-[16px] font-bold underline-offset-[6px] transition ${info.when === w ? "text-ink underline decoration-red decoration-2" : "text-muted hover:text-ink-2"}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="sign mb-2 block text-[14px] font-bold text-ink-2">Pagamento</span>
          <Boxes options={PAYMENTS.map((p) => ({ id: p, label: p }))} value={info.payment} onChange={(v) => setInfo({ payment: v })} cols="grid-cols-3" />
        </div>
        <Field label="Observações">
          <textarea
            className="w-full resize-none border-b border-line-strong bg-transparent py-2 text-[17px] text-ink placeholder:italic placeholder:text-muted/60 focus:border-tan focus:outline-none"
            rows={2}
            value={info.notes}
            onChange={(e) => setInfo({ notes: e.target.value.slice(0, 500) })}
            placeholder="Algo mais que a gente precise saber"
          />
        </Field>

        <div className="border border-line-strong">
          <p className="sign border-b border-line-strong px-4 py-2 text-[14px] font-bold text-ink-2">Comanda</p>
          <ul className="px-4 py-2">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3 py-1 text-[15px] text-ink-2">
                <span className="truncate">
                  <span className="sign tabular font-bold text-ink">{formatQty(l.qty, l.unit)}</span> {l.name}
                </span>
                <span className="sign tabular shrink-0 font-semibold">{brl(lineTotal(l))}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line-strong bg-bg px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mb-3 flex items-end justify-between">
          <span className="sign text-[16px] font-bold text-ink-2">Total estimado</span>
          <span className="sign tabular text-[32px] font-extrabold leading-none text-ink">{brl(total)}</span>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="sign focus-ring flex h-14 w-full items-center justify-center gap-3 bg-red text-[18px] font-extrabold text-white transition hover:bg-red-bright disabled:opacity-70"
        >
          {sending ? <Loader2 className="size-5 animate-spin" /> : <WhatsAppIcon className="size-5" />}
          {sending ? "Registrando pedido" : "Enviar pedido no WhatsApp"}
        </button>
        <p className="mt-2 text-center text-[12px] italic text-muted">Os detalhes finais você confirma com a loja no WhatsApp.</p>
      </div>
    </form>
  );
}
