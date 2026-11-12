"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Clock, MapPin, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { cartTotal, useCart } from "@/lib/cart";
import { brl, effectivePrice } from "@/lib/format";
import { hoursSummary, openStatus } from "@/lib/hours";
import { buildIndex, search, SEARCH_SUGGESTIONS } from "@/lib/search";
import type { Catalog, CategoryWithProducts, Product } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";
import { CartDrawer } from "./cart-drawer";
import { KitCard } from "./kit-card";
import { ProductCard } from "./product-card";
import { ProductSheet } from "./product-sheet";

export function Storefront({ catalog }: { catalog: Catalog }) {
  const { settings, categories, kits } = catalog;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [active, setActive] = useState<string>("kits");
  const [status, setStatus] = useState<{ open: boolean; label: string } | null>(null);
  const index = useMemo(() => buildIndex(categories), [categories]);
  const results = useMemo(() => search(index, query), [index, query]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const visibleKits = kits.filter((k) => k.available);
  const searching = query.trim().length > 0;

  // status de funcionamento só no cliente (fuso de São Paulo)
  useEffect(() => {
    const tick = () => setStatus(openStatus(settings.hours));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [settings.hours]);

  // mantém o carrinho fiel aos preços atuais
  const sync = useCart((s) => s.sync);
  useEffect(() => {
    const fresh = new Map<string, { price: number; available: boolean; name: string }>();
    categories.forEach((c) => c.products.forEach((p) => fresh.set(`product:${p.id}`, { price: effectivePrice(p), available: p.available, name: p.name })));
    kits.forEach((k) => fresh.set(`kit:${k.id}`, { price: k.price, available: k.available, name: k.name }));
    const run = () => {
      const removed = sync(fresh);
      if (removed.length) toast.warning("Alguns itens saíram do seu pedido", { description: `${removed.join(", ")} esgotou.` });
    };
    if (useCart.persist.hasHydrated()) run();
    else return useCart.persist.onFinishHydration(run);
  }, [categories, kits, sync]);

  // seção ativa conforme a rolagem
  useEffect(() => {
    if (searching) return;
    const els = document.querySelectorAll<HTMLElement>("[data-section]");
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.getAttribute("data-section")!);
      },
      { rootMargin: "-140px 0px -55% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [searching]);

  const close = useCallback(() => setSelected(null), []);

  return (
    <>
      <Header settings={settings} status={status} />
      <Hero settings={settings} status={status} />

      <StickyNav
        query={query}
        setQuery={setQuery}
        categories={categories}
        hasKits={visibleKits.length > 0}
        active={active}
      />

      <main className="mx-auto max-w-6xl px-4 pb-40 md:px-6">
        {searching ? (
          <SearchResults
            query={query}
            results={results.map((r) => r.product)}
            catById={catById}
            onOpen={setSelected}
            whatsapp={settings.whatsapp}
            setQuery={setQuery}
          />
        ) : (
          <>
            {visibleKits.length > 0 && (
              <section id="kits" data-section="kits" className="pt-10 md:pt-14">
                <SectionTitle eyebrow="Para facilitar sua semana" title="Kits & promoções" icon />
                <div className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
                  {visibleKits.map((k) => (
                    <KitCard key={k.id} kit={k} />
                  ))}
                </div>
              </section>
            )}
            {categories.map((c) => (
              <CategorySection key={c.id} category={c} onOpen={setSelected} />
            ))}
          </>
        )}
      </main>

      <Footer settings={settings} />
      <MobileCartBar />
      <ProductSheet product={selected} category={selected ? catById.get(selected.category_id) ?? null : null} onClose={close} />
      <CartDrawer settings={settings} live={catalog.live} />
    </>
  );
}

function Header({ settings, status }: { settings: Catalog["settings"]; status: { open: boolean; label: string } | null }) {
  const count = useCart((s) => s.lines.length);
  const setOpen = useCart((s) => s.setOpen);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <a href="#topo" className="focus-ring rounded-lg">
          <Wordmark compact />
        </a>
        <div className="flex items-center gap-2">
          {status && (
            <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-ink-2 lg:inline-flex">
              <span className={`size-1.5 rounded-full ${status.open ? "bg-ok shadow-[0_0_8px_rgba(95,174,123,.9)]" : "bg-muted"}`} />
              {status.label}
            </span>
          )}
          <a
            href={waLink(settings.whatsapp, "Olá! Vim pelo catálogo do Atelier da Carne.")}
            target="_blank"
            rel="noopener"
            className="focus-ring hidden h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm text-ink-2 transition hover:text-ink sm:inline-flex"
          >
            <WhatsAppIcon className="size-4" /> Falar com a loja
          </a>
          <button
            onClick={() => setOpen(true)}
            className="focus-ring relative inline-flex h-10 items-center gap-2 rounded-full bg-ink pl-3.5 pr-4 text-sm font-semibold text-bg transition hover:bg-white active:scale-95"
            aria-label={`Abrir pedido (${count} itens)`}
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Pedido</span>
            <AnimatePresence mode="popLayout">
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="tabular grid min-w-5 place-items-center rounded-full bg-red px-1.5 text-[11px] leading-5 text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ settings, status }: { settings: Catalog["settings"]; status: { open: boolean; label: string } | null }) {
  return (
    <section id="topo" className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 85% 30%, rgba(140,16,16,.38) 0%, rgba(140,16,16,0) 70%), radial-gradient(40% 60% at 10% 100%, rgba(201,164,135,.08) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-7 pt-7 md:grid-cols-[1.25fr_1fr] md:px-6 md:pb-16 md:pt-16">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[11px] font-semibold uppercase tracking-[0.32em] text-tan"
          >
            Catálogo de produtos · Curitiba
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-display mt-3 text-[40px] font-semibold leading-[0.95] tracking-[-0.01em] text-ink sm:text-6xl md:text-[78px]"
          >
            Cortes de verdade,
            <br />
            <span className="font-normal italic text-tan">feitos com arte.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-4 max-w-lg text-[14px] leading-relaxed text-ink-2 md:mt-5 md:text-base"
          >
            Escolha seus cortes, veja de onde cada um vem e monte seu pedido em poucos toques. Ele chega pronto no
            nosso WhatsApp — com preços sempre atualizados.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-5 flex flex-wrap gap-2 text-xs text-ink-2 md:mt-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/60 px-3 py-2">
              <span className={`size-1.5 rounded-full ${status?.open ? "bg-ok shadow-[0_0_8px_rgba(95,174,123,.9)]" : "bg-muted"}`} />
              {status?.label ?? hoursSummary(settings.hours)[0]}
            </span>
            {settings.address && (
              <a
                href={settings.maps_url ?? "#"}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface/60 px-3 py-2 transition hover:text-ink"
              >
                <MapPin className="size-3.5 text-red-bright" /> {settings.address.split("—")[0].trim()}
              </a>
            )}
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden justify-center md:flex"
        >
          <div className="absolute inset-0 m-auto size-[340px] rounded-full bg-red/20 blur-[90px]" />
          <LogoMark className="relative h-[300px] w-auto drop-shadow-[0_20px_40px_rgba(0,0,0,.6)]" priority />
        </motion.div>
      </div>
      {settings.announcement && (
        <div className="relative border-t border-line bg-blood/90">
          <p className="mx-auto max-w-6xl px-4 py-2.5 text-center text-[13px] font-medium text-white/95 md:px-6">{settings.announcement}</p>
        </div>
      )}
    </section>
  );
}

function StickyNav({
  query,
  setQuery,
  categories,
  hasKits,
  active,
}: {
  query: string;
  setQuery: (q: string) => void;
  categories: CategoryWithProducts[];
  hasKits: boolean;
  active: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const items = [...(hasKits ? [{ id: "kits", name: "Kits & promoções", count: 0 }] : []), ...categories.map((c) => ({ id: c.slug, name: c.name, count: c.products.length }))];

  useEffect(() => {
    const el = chipsRef.current?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const go = (id: string) => {
    setQuery("");
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="sticky top-16 z-30 border-b border-line bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 pt-3 md:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value && window.scrollY < 300) {
                const top = document.querySelector("main")!.getBoundingClientRect().top + window.scrollY - 130;
                window.scrollTo({ top, behavior: "smooth" });
              }
            }}
            placeholder="Buscar corte: picanha, costela, ancho…"
            aria-label="Buscar produtos"
            className="focus-ring h-12 w-full rounded-2xl border border-line-strong bg-surface pl-11 pr-11 text-[15px] text-ink placeholder:text-muted/80 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-3 hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div ref={chipsRef} className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-3 md:mx-0 md:px-0">
          {items.map((it) => {
            const on = !query && active === it.id;
            return (
              <button
                key={it.id}
                data-chip={it.id}
                onClick={() => go(it.id)}
                className={`focus-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${
                  on ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:border-tan/40 hover:text-ink"
                }`}
              >
                {it.id === "kits" && <Sparkles className="size-3.5" />}
                {it.name}
                {it.count > 0 && <span className={`tabular text-[11px] ${on ? "text-bg/60" : "text-muted"}`}>{it.count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, icon }: { eyebrow: string; title: string; icon?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-tan">
        {icon && <Sparkles className="size-3.5" />}
        {eyebrow}
      </p>
      <h2 className="font-display mt-2 text-[34px] font-semibold leading-none text-ink md:text-5xl">{title}</h2>
    </div>
  );
}

function CategorySection({ category, onOpen }: { category: CategoryWithProducts; onOpen: (p: Product) => void }) {
  if (!category.products.length) return null;
  const available = category.products.filter((p) => p.available).length;
  return (
    <section id={category.slug} data-section={category.slug} className="pt-12 md:pt-16">
      <div className="relative -mx-4 overflow-hidden md:mx-0 md:rounded-3xl">
        {category.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.cover_url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/70 to-transparent md:from-transparent" />
        <div className="relative px-4 py-9 md:px-10 md:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tan">
            {available} {available === 1 ? "opção" : "opções"}
          </p>
          <h2 className="font-display mt-2 text-[38px] font-semibold leading-none text-ink md:text-6xl">{category.name}</h2>
          {category.subtitle && <p className="mt-3 max-w-md text-sm text-ink-2 md:text-[15px]">{category.subtitle}</p>}
        </div>
        <div className="absolute bottom-0 left-4 h-[3px] w-14 bg-red md:left-10" />
      </div>
      <div className="mt-2 md:mt-6 md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {category.products.map((p, i) => (
          <ProductCard key={p.id} product={p} cover={category.cover_url} onOpen={onOpen} index={i} />
        ))}
      </div>
    </section>
  );
}

function SearchResults({
  query,
  results,
  catById,
  onOpen,
  whatsapp,
  setQuery,
}: {
  query: string;
  results: Product[];
  catById: Map<string, CategoryWithProducts>;
  onOpen: (p: Product) => void;
  whatsapp: string;
  setQuery: (q: string) => void;
}) {
  return (
    <section className="pt-8">
      <p className="text-sm text-muted">
        {results.length ? (
          <>
            <span className="tabular font-semibold text-ink">{results.length}</span> {results.length === 1 ? "resultado" : "resultados"} para{" "}
            <span className="text-ink">“{query}”</span>
          </>
        ) : null}
      </p>
      {results.length ? (
        <div className="mt-3 md:mt-6 md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {results.map((p, i) => (
            <ProductCard key={p.id} product={p} cover={catById.get(p.category_id)?.cover_url} onOpen={onOpen} index={i} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-md py-16 text-center">
          <LogoMark className="mx-auto h-16 w-auto opacity-25" />
          <p className="font-display mt-6 text-2xl text-ink">Não encontramos “{query}”</p>
          <p className="mt-2 text-sm text-muted">Talvez a gente tenha com outro nome — ou dá pra encomendar.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SEARCH_SUGGESTIONS.slice(0, 5).map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="rounded-full border border-line-strong px-3 py-1.5 text-xs text-ink-2 hover:text-ink">
                {s}
              </button>
            ))}
          </div>
          <a
            href={waLink(whatsapp, `Olá! Vocês têm ${query}?`)}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#1fa855] px-5 text-sm font-semibold text-white"
          >
            <WhatsAppIcon className="size-4" /> Perguntar no WhatsApp
          </a>
        </div>
      )}
    </section>
  );
}

function MobileCartBar() {
  const lines = useCart((s) => s.lines);
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const total = cartTotal(lines);
  return (
    <AnimatePresence>
      {lines.length > 0 && !open && (
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <button
            onClick={() => setOpen(true)}
            className="flex h-15 w-full items-center justify-between rounded-2xl bg-red px-5 text-white shadow-[0_18px_40px_-10px_rgba(0,0,0,.8)] active:scale-[.98]"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <span className="tabular grid size-7 place-items-center rounded-full bg-black/25 text-xs font-semibold">{lines.length}</span>
              Ver pedido
            </span>
            <span className="tabular text-[15px] font-semibold">{brl(total)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Footer({ settings }: { settings: Catalog["settings"] }) {
  return (
    <footer className="border-t border-line bg-bg-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{settings.tagline}. Cortes selecionados, preparados com cuidado no Portão, em Curitiba.</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-tan">Horários</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
            {hoursSummary(settings.hours).map((h) => (
              <li key={h} className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted" /> {h}
              </li>
            ))}
          </ul>
          {settings.address && (
            <a href={settings.maps_url ?? "#"} target="_blank" rel="noopener" className="mt-4 flex items-start gap-2 text-sm text-ink-2 hover:text-ink">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-red-bright" /> {settings.address}
            </a>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-tan">Fale com a gente</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-ink-2 hover:text-ink">
              <WhatsAppIcon className="size-4" /> {settings.phone_display}
            </a>
            {settings.instagram && (
              <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-ink-2 hover:text-ink">
                <InstagramIcon className="size-4" /> @{settings.instagram}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted md:px-6">
          <span>Preços por kg sujeitos à pesagem. Imagens ilustrativas.</span>
          <a href="/admin" className="inline-flex items-center gap-1 hover:text-ink">
            Portal da loja <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
