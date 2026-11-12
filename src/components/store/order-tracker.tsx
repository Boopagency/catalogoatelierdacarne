"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Bike, Check, CircleX, Clock, PackageCheck, Scissors, Store } from "lucide-react";
import { motion } from "motion/react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/logo";
import { brl, dateTime, formatQty, STATUS_LABEL } from "@/lib/format";
import { getLocalOrder, type LocalOrder } from "@/lib/local-orders";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { OrderStatus, Settings, TrackedOrder } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

type Props = { code: string; settings: Settings; live: boolean };

export function OrderTracker(props: Props) {
  return (
    <Suspense>
      <Tracker {...props} />
    </Suspense>
  );
}

function Tracker({ code, settings, live }: Props) {
  const params = useSearchParams();
  const isNew = params.get("novo") === "1";
  const alreadyOpened = params.get("aberto") === "1";
  const [local, setLocal] = useState<LocalOrder | null>(null);
  const [remote, setRemote] = useState<TrackedOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLocal(getLocalOrder(code) ?? null);
  }, [code]);

  useEffect(() => {
    if (!live) {
      setLoaded(true);
      return;
    }
    let stop = false;
    const load = async () => {
      const { data } = await supabaseBrowser().rpc("track_order", { p_code: code });
      if (!stop) {
        setRemote((data as TrackedOrder) ?? null);
        setLoaded(true);
      }
    };
    load();
    const t = setInterval(load, 15_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [code, live]);

  // No celular, leva direto ao WhatsApp uma única vez
  useEffect(() => {
    if (!isNew || alreadyOpened || !local) return;
    const flag = `atelier-wa-${code}`;
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");
    const t = setTimeout(() => (window.location.href = waLink(local.whatsapp, local.message)), 900);
    return () => clearTimeout(t);
  }, [isNew, alreadyOpened, local, code]);

  const status: OrderStatus = remote?.status ?? "novo";
  const fulfillment = remote?.fulfillment ?? local?.fulfillment ?? "retirada";
  const items = remote?.items ?? local?.lines ?? [];
  const total = remote?.subtotal ?? local?.total ?? 0;
  const number = remote?.number ?? local?.number ?? null;
  const notFound = loaded && !remote && !local;

  const steps: { id: OrderStatus; label: string; icon: typeof Check }[] = [
    { id: "novo", label: "Pedido recebido", icon: Check },
    { id: "confirmado", label: "Confirmado pela loja", icon: PackageCheck },
    { id: "separando", label: "Separando seus cortes", icon: Scissors },
    fulfillment === "entrega"
      ? { id: "em_rota", label: "Saiu para entrega", icon: Bike }
      : { id: "pronto", label: "Pronto para retirada", icon: Store },
    { id: "concluido", label: fulfillment === "entrega" ? "Entregue" : "Retirado", icon: Check },
  ];
  const order: OrderStatus[] = ["novo", "confirmado", "separando", "pronto", "em_rota", "concluido"];
  const reached = (s: OrderStatus) => order.indexOf(status) >= order.indexOf(s) || (s === "em_rota" && status === "concluido");
  const when = (s: OrderStatus) => remote?.status_history?.find((h) => h.status === s)?.at;

  const wa = local ? waLink(local.whatsapp, local.message) : waLink(settings.whatsapp, `Olá! Quero falar sobre o pedido ${number ? `#${number}` : code}.`);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-sm text-ink-2 hover:text-ink">
            <ArrowLeft className="size-4" /> Catálogo
          </Link>
          <Wordmark compact />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-8">
        {notFound ? (
          <div className="py-20 text-center">
            <p className="font-display text-3xl text-ink">Pedido não encontrado</p>
            <p className="mt-2 text-sm text-muted">Confira o código {code} ou fale com a loja.</p>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              {isNew && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 180, delay: 0.1 }}
                  className="mb-5 grid size-16 place-items-center rounded-full bg-red text-white shadow-[0_0_0_10px_rgba(179,32,27,.15)]"
                >
                  <Check className="size-8" strokeWidth={3} />
                </motion.div>
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tan">
                {number ? `Pedido #${number}` : "Pedido"} · código {code}
              </p>
              <h1 className="font-display mt-2 text-[38px] font-semibold leading-[1.02] text-ink md:text-5xl">
                {status === "cancelado"
                  ? "Pedido cancelado"
                  : isNew
                    ? <>Pedido registrado{remote?.first_name ? `, ${remote.first_name}` : ""}!</>
                    : STATUS_LABEL[status]}
              </h1>
              {isNew && status !== "cancelado" && (
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  Último passo: envie a mensagem no WhatsApp para a loja confirmar. Guarde esta página para acompanhar o andamento.
                </p>
              )}
            </motion.div>

            <a
              href={wa}
              target="_blank"
              rel="noopener"
              className="focus-ring mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1fa855] text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(31,168,85,.8)] transition hover:bg-[#23bd60] active:scale-[.98]"
            >
              <WhatsAppIcon className="size-5" />
              {isNew ? "Enviar pedido no WhatsApp" : "Falar com a loja"}
            </a>

            {status === "cancelado" ? (
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-line bg-surface p-5 text-sm text-ink-2">
                <CircleX className="size-5 text-red-bright" /> Este pedido foi cancelado. Fale com a loja se tiver dúvidas.
              </div>
            ) : (
              <ol className="mt-10 space-y-0">
                {steps.map((s, i) => {
                  const done = reached(s.id);
                  const current = done && (i === steps.length - 1 || !reached(steps[i + 1].id));
                  const at = when(s.id);
                  return (
                    <li key={s.id} className="relative flex gap-4 pb-7 last:pb-0">
                      {i < steps.length - 1 && (
                        <span className={`absolute left-[17px] top-9 h-[calc(100%-36px)] w-px ${reached(steps[i + 1].id) ? "bg-red" : "bg-line-strong"}`} />
                      )}
                      <span
                        className={`relative grid size-9 shrink-0 place-items-center rounded-full border transition ${
                          done ? "border-red bg-red text-white" : "border-line-strong bg-surface text-muted"
                        } ${current ? "shadow-[0_0_0_6px_rgba(179,32,27,.18)]" : ""}`}
                      >
                        <s.icon className="size-4" />
                      </span>
                      <div className="pt-1.5">
                        <p className={`text-[15px] font-medium ${done ? "text-ink" : "text-muted"}`}>{s.label}</p>
                        {at && <p className="tabular mt-0.5 text-xs text-muted">{dateTime(at)}</p>}
                        {current && !at && live && <p className="mt-0.5 text-xs text-muted">Atualiza sozinho</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {items.length > 0 && (
              <section className="mt-10 rounded-3xl border border-line bg-surface p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-ink">Itens</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    {fulfillment === "entrega" ? <Bike className="size-3.5" /> : <Store className="size-3.5" />}
                    {fulfillment === "entrega" ? "Entrega" : "Retirada na loja"}
                  </span>
                </div>
                <ul className="mt-4 divide-y divide-line">
                  {items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-4 py-3 text-sm">
                      <div>
                        <p className="text-ink">
                          <span className="tabular text-ink-2">{formatQty(Number(it.quantity), it.unit)}</span> · {it.name}
                        </p>
                        {it.notes && <p className="mt-0.5 text-xs italic text-tan">“{it.notes}”</p>}
                      </div>
                      <span className="tabular shrink-0 text-ink">{brl(Number(it.line_total))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
                  <span className="text-sm text-ink-2">Total estimado</span>
                  <span className="tabular font-display text-2xl font-semibold text-ink">{brl(Number(total))}</span>
                </div>
              </section>
            )}

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <Clock className="size-3.5" /> {settings.address}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
