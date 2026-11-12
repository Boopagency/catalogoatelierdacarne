"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
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

  const steps: { id: OrderStatus; label: string }[] = [
    { id: "novo", label: "Pedido recebido" },
    { id: "confirmado", label: "Confirmado pela loja" },
    { id: "separando", label: "Separando os cortes" },
    fulfillment === "entrega" ? { id: "em_rota", label: "Saiu para entrega" } : { id: "pronto", label: "Pronto para retirar" },
    { id: "concluido", label: fulfillment === "entrega" ? "Entregue" : "Retirado" },
  ];
  const order: OrderStatus[] = ["novo", "confirmado", "separando", "pronto", "em_rota", "concluido"];
  const reached = (s: OrderStatus) => order.indexOf(status) >= order.indexOf(s) || (s === "em_rota" && status === "concluido");
  const when = (s: OrderStatus) => remote?.status_history?.find((h) => h.status === s)?.at;

  const wa = local ? waLink(local.whatsapp, local.message) : waLink(settings.whatsapp, `Olá! Quero falar sobre o pedido ${number ? `nº ${number}` : code}.`);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="sign focus-ring inline-flex items-center gap-2 text-[15px] font-bold text-ink-2 hover:text-ink">
            <ArrowLeft className="size-4" /> Catálogo
          </Link>
          <Wordmark compact />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
        {notFound ? (
          <div className="border border-line px-6 py-20 text-center">
            <p className="sign text-[48px] font-extralight leading-none text-ink">Pedido não encontrado</p>
            <p className="mt-3 text-[15px] italic text-muted">Confira o código {code} ou fale com a loja.</p>
          </div>
        ) : (
          <>
            <p className="sign text-[15px] font-bold text-tan">Código {code}</p>
            <h1 className="sign mt-2 text-[64px] font-black leading-[0.82] text-ink md:text-[96px]">
              {number ? `Pedido nº ${number}` : "Seu pedido"}
            </h1>
            {status === "cancelado" ? (
              <p className="mt-5 border-l-2 border-red pl-4 text-[17px] text-ink-2">Este pedido foi cancelado. Fale com a loja se tiver dúvidas.</p>
            ) : isNew ? (
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
                {remote?.first_name ? `${remote.first_name}, seu` : "Seu"} pedido foi registrado. Falta um passo: enviar a mensagem no WhatsApp para a loja confirmar.
                Guarde esta página para acompanhar.
              </p>
            ) : (
              <p className="sign mt-5 text-[24px] font-bold text-ink-2">{STATUS_LABEL[status]}</p>
            )}

            <a
              href={wa}
              target="_blank"
              rel="noopener"
              className="sign focus-ring mt-8 flex h-14 w-full items-center justify-center gap-3 bg-red text-[18px] font-extrabold text-white transition hover:bg-red-bright md:w-auto md:px-8 md:inline-flex"
            >
              <WhatsAppIcon className="size-5" />
              {isNew ? "Enviar pedido no WhatsApp" : "Falar com a loja"}
            </a>

            {status !== "cancelado" && (
              <section className="mt-14">
                <h2 className="sign border-b border-line-strong pb-2 text-[22px] font-extrabold text-ink">Andamento</h2>
                <ol>
                  {steps.map((s, i) => {
                    const done = reached(s.id);
                    const current = done && (i === steps.length - 1 || !reached(steps[i + 1].id));
                    const at = when(s.id);
                    return (
                      <li key={s.id} className={`flex items-center gap-4 border-b border-line py-4 ${done ? "" : "opacity-45"}`}>
                        <span className={`sign tabular grid size-9 shrink-0 place-items-center text-[15px] font-bold ${current ? "bg-red text-white" : done ? "bg-ink text-bg" : "border border-line-strong text-muted"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={`sign flex-1 text-[20px] font-bold ${done ? "text-ink" : "text-muted"}`}>{s.label}</span>
                        {at ? (
                          <span className="sign tabular text-[14px] font-medium text-muted">{dateTime(at)}</span>
                        ) : current && live ? (
                          <span className="text-[13px] italic text-muted">atualiza sozinho</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {items.length > 0 && (
              <section className="mt-14 border border-line-strong">
                <div className="flex items-center justify-between border-b border-line-strong px-5 py-3">
                  <h2 className="sign text-[22px] font-extrabold text-ink">Comanda</h2>
                  <span className="sign text-[14px] font-bold text-muted">{fulfillment === "entrega" ? "Entrega" : "Retirada na loja"}</span>
                </div>
                <ul className="px-5">
                  {items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-4 border-b border-line py-3 last:border-0">
                      <div>
                        <p className="text-[16px] text-ink">
                          <span className="sign tabular font-bold">{formatQty(Number(it.quantity), it.unit)}</span> {it.name}
                        </p>
                        {it.notes && <p className="mt-1 text-[14px] italic text-tan">{it.notes}</p>}
                      </div>
                      <span className="sign tabular shrink-0 text-[17px] font-bold text-ink">{brl(Number(it.line_total))}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-end justify-between border-t-4 border-double border-line-strong px-5 py-4">
                  <span className="sign text-[16px] font-bold text-ink-2">Total estimado</span>
                  <span className="sign tabular text-[34px] font-extrabold leading-none text-ink">{brl(Number(total))}</span>
                </div>
              </section>
            )}

            {settings.address && <p className="mt-8 text-[14px] italic text-muted">{settings.address}</p>}
          </>
        )}
      </main>
    </div>
  );
}
