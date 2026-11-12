"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ExternalLink, LayoutGrid, LogOut, Package, ReceiptText, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/ui/logo";
import { sb } from "@/lib/admin";
import { brl } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Pedidos", icon: ReceiptText },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/kits", label: "Kits", icon: Sparkles },
  { href: "/admin/categorias", label: "Categorias", icon: LayoutGrid },
  { href: "/admin/loja", label: "Loja", icon: Settings2 },
];

type Ctx = { newCount: number; refreshCount: () => void; lastEvent: number };
const AdminCtx = createContext<Ctx>({ newCount: 0, refreshCount: () => {}, lastEvent: 0 });
export const useAdmin = () => useContext(AdminCtx);

function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.55);
    });
  } catch {
    /* navegador sem áudio */
  }
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [newCount, setNewCount] = useState(0);
  const [lastEvent, setLastEvent] = useState(0);

  const refreshCount = useCallback(async () => {
    const { count } = await sb().from("orders").select("id", { count: "exact", head: true }).eq("status", "novo");
    setNewCount(count ?? 0);
  }, []);

  useEffect(() => {
    refreshCount();
    const channel = sb()
      .channel("pedidos")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, async (payload) => {
        const { data: fresh } = await sb().from("orders").select("number, customer_name, subtotal").eq("id", (payload.new as { id: string }).id).maybeSingle();
        const o = (fresh ?? payload.new) as { number: number; customer_name: string; subtotal: number };
        chime();
        toast.success(`Novo pedido #${o.number}`, {
          description: `${o.customer_name} · ${brl(Number(o.subtotal))}`,
          duration: 10000,
          action: { label: "Ver", onClick: () => router.push("/admin") },
        });
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
          new Notification(`Novo pedido #${o.number}`, { body: o.customer_name, icon: "/brand/icon-192.png" });
        }
        refreshCount();
        setLastEvent(Date.now());
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        refreshCount();
        setLastEvent(Date.now());
      })
      .subscribe();
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    return () => {
      sb().removeChannel(channel);
    };
  }, [refreshCount, router]);

  const logout = async () => {
    await sb().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <AdminCtx.Provider value={{ newCount, refreshCount, lastEvent }}>
      <div className="min-h-dvh md:pl-64">
        {/* Sidebar desktop */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg-2 md:flex">
          <div className="px-5 pb-6 pt-6">
            <Wordmark compact />
            <p className="mt-2.5 pl-[38px] text-[10px] font-semibold uppercase tracking-[0.28em] text-tan">Portal da loja</p>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`focus-ring flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  isActive(n.href) ? "bg-surface-3 text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <n.icon className={`size-[18px] ${isActive(n.href) ? "text-red-bright" : ""}`} />
                {n.label}
                {n.href === "/admin" && newCount > 0 && (
                  <span className="tabular ml-auto grid min-w-6 place-items-center bg-red px-1.5 text-[11px] leading-6 text-white">{newCount}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="space-y-1 border-t border-line p-3">
            <a href="/" target="_blank" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
              <ExternalLink className="size-4" /> Ver catálogo
            </a>
            <button onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
              <LogOut className="size-4" /> Sair
            </button>
            <p className="truncate px-3 pt-1 text-[11px] text-muted">{email}</p>
          </div>
        </aside>

        {/* Topo mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur-xl md:hidden">
          <Wordmark compact />
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" className="grid size-10 place-items-center text-ink-2" aria-label="Ver catálogo">
              <ExternalLink className="size-[18px]" />
            </a>
            <button onClick={logout} className="grid size-10 place-items-center text-ink-2" aria-label="Sair">
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-10">{children}</main>

        {/* Abas mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg-2/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium ${isActive(n.href) ? "text-ink" : "text-muted"}`}>
              <n.icon className={`size-5 ${isActive(n.href) ? "text-red-bright" : ""}`} />
              {n.label}
              {n.href === "/admin" && newCount > 0 && (
                <span className="tabular absolute right-[calc(50%-18px)] top-2 grid min-w-[18px] place-items-center bg-red px-1 text-[10px] leading-[18px] text-white">{newCount}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </AdminCtx.Provider>
  );
}
