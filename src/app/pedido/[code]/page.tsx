import type { Metadata } from "next";
import { OrderTracker } from "@/components/store/order-tracker";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };

export default async function PedidoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { settings, live } = await getCatalog();
  return <OrderTracker code={code.toUpperCase()} settings={settings} live={live} />;
}
