import { brl, formatQty, formatPhone } from "./format";
import { lineTotal, type CartLine, type CheckoutInfo } from "./cart";

export function waLink(number: string, text?: string) {
  const n = number.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function buildOrderMessage(opts: {
  storeName: string;
  lines: CartLine[];
  total: number;
  info: CheckoutInfo;
  number?: number | null;
  code: string;
  trackUrl?: string;
}) {
  const { lines, total, info } = opts;
  const hasKg = lines.some((l) => l.unit === "kg");
  const out: string[] = [];
  out.push(`*Pedido ${opts.number ? `#${opts.number}` : opts.code} · ${opts.storeName}*`);
  out.push("");
  out.push("*Itens*");
  for (const l of lines) {
    out.push(`• ${formatQty(l.qty, l.unit)} — ${l.name} — ${brl(lineTotal(l))}`);
    if (l.notes.trim()) out.push(`   _${l.notes.trim()}_`);
  }
  out.push("");
  out.push(`*Total estimado: ${brl(total)}*`);
  if (hasKg) out.push("_Itens por kg podem variar um pouco na pesagem._");
  out.push("");
  out.push(`*Nome:* ${info.name.trim()}`);
  out.push(`*WhatsApp:* ${formatPhone(info.phone)}`);
  if (info.fulfillment === "entrega") {
    out.push("*Recebimento:* Entrega");
    out.push(`*Endereço:* ${info.address.trim()}${info.neighborhood.trim() ? ` — ${info.neighborhood.trim()}` : ""}`);
  } else {
    out.push("*Recebimento:* Retirada na loja");
  }
  if (info.when.trim()) out.push(`*Quando:* ${info.when.trim()}`);
  if (info.payment) out.push(`*Pagamento:* ${info.payment}`);
  if (info.notes.trim()) out.push(`*Observações:* ${info.notes.trim()}`);
  if (opts.trackUrl) {
    out.push("");
    out.push(`Acompanhar pedido: ${opts.trackUrl}`);
  }
  return out.join("\n");
}
