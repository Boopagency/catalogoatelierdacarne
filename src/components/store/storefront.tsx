"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Search, X } from "lucide-react";
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

type Status = { open: boolean; label: string } | null;
const pad = (n: number) => String(n).padStart(2, "0");

export function Storefront({ catalog }: { catalog: Catalog }) {
  const { settings, categories, kits } = catalog;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [active, setActive] = useState<string>("kits");
  const [status, setStatus] = useState<Status>(null);
  const index = useMemo(() => buildIndex(categories), [categories]);
  const results = useMemo(() => search(index, query), [index, query]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const visibleKits = kits.filter((k) => k.available);
  const searching = query.trim().length > 0;

  useEffect(() => {
    const tick = () => setStatus(openStatus(settings.hours));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [settings.hours]);

  // mantém o carrinho fiel aos preços do dia
  const sync = useCart((s) => s.sync);
  useEffect(() => {
    const fresh = new Map<string, { price: number; available: boolean; name: string }>();
    categories.forEach((c) => c.products.forEach((p) => fresh.set(`product:${p.id}`, { price: effectivePrice(p), available: p.available, name: p.name })));
    kits.forEach((k) => fresh.set(`kit:${k.id}`, { price: k.price, available: k.available, name: k.name }));
    const run = () => {
      const removed = sync(fresh);
      if (removed.length) toast.warning(`Saiu do seu pedido porque esgotou: ${removed.join(", ")}.`);
    };
    if (useCart.persist.hasHydrated()) run();
    else return useCart.persist.onFinishHydration(run);
  }, [categories, kits, sync]);

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
      <StickyNav query={query} setQuery={setQuery} categories={categories} hasKits={visibleKits.length > 0} active={active} />

      <main className="mx-auto max-w-[1320px] px-4 pb-40 md:px-8">
        {searching ? (
          <SearchResults query={query} results={results.map((r) => r.product)} catById={catById} onOpen={setSelected} whatsapp={settings.whatsapp} setQuery={setQuery} />
        ) : (
          <>
            {visibleKits.length > 0 && (
              <section id="kits" data-section="kits" className="pt-14 md:pt-20">
                <SectionHead number="00" title="Kits e promoções" note="Combinações prontas, preço fechado." />
                <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
                  {visibleKits.map((k, i) => (
                    <KitCard key={k.id} kit={k} index={i} />
                  ))}
                </div>
              </section>
            )}
            {categories.map((c, i) => (
              <CategorySection key={c.id} category={c} number={pad(i + 1)} onOpen={setSelected} />
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

function StatusText({ status, className = "" }: { status: Status; className?: string }) {
  if (!status) return null;
  return (
    <span className={`sign inline-flex items-center gap-2 font-semibold ${className}`}>
      <span className={`size-2 ${status.open ? "bg-ok" : "bg-red-bright"}`} />
      {status.label}
    </span>
  );
}

function Header({ settings, status }: { settings: Catalog["settings"]; status: Status }) {
  const count = useCart((s) => s.lines.length);
  const setOpen = useCart((s) => s.setOpen);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-3 px-4 md:px-8">
        <a href="#topo" className="focus-ring">
          <Wordmark compact />
        </a>
        <div className="flex h-full items-center">
          <span className="hidden px-5 lg:block">
            <StatusText status={status} className="text-[14px] text-ink-2" />
          </span>
          <a
            href={waLink(settings.whatsapp, "Olá! Vim pelo catálogo do Atelier da Carne.")}
            target="_blank"
            rel="noopener"
            className="sign focus-ring hidden h-full items-center gap-2 border-l border-line px-5 text-[15px] font-bold text-ink-2 transition hover:text-ink sm:inline-flex"
          >
            <WhatsAppIcon className="size-4" /> WhatsApp
          </a>
          <button
            onClick={() => setOpen(true)}
            className="sign focus-ring -mr-4 inline-flex h-full items-center gap-3 border-l border-line pl-5 pr-4 text-[15px] font-bold text-ink transition hover:bg-surface md:-mr-8 md:pr-8"
            aria-label={`Abrir pedido (${count} itens)`}
          >
            Pedido
            <span className={`tabular grid h-7 min-w-7 place-items-center px-1.5 text-[14px] ${count ? "bg-red text-white" : "border border-line-strong text-muted"}`}>{count}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ settings, status }: { settings: Catalog["settings"]; status: Status }) {
  const hours = hoursSummary(settings.hours);
  return (
    <section id="topo" className="border-b border-line">
      <div className="mx-auto grid max-w-[1320px] md:grid-cols-12 md:px-8">
        {/* Foto pôster */}
        <div className="frame relative aspect-[4/5] overflow-hidden md:order-2 md:col-span-5 md:aspect-auto md:min-h-[640px] md:border-x md:border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/tbone.webp" alt="T-bone marmorizado" className="poster-img absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          <p className="font-script absolute bottom-10 left-8 -rotate-[7deg] text-[64px] leading-none text-[#f2d4cc] md:hidden" aria-hidden>
            Atelier
          </p>
          <p className="sign absolute bottom-7 right-7 text-right text-[12px] font-bold leading-tight text-white/75">
            Nº 1710
            <br />
            Portão · Curitiba
          </p>
        </div>

        {/* Tipografia */}
        <div className="relative z-10 flex flex-col justify-between px-4 pb-8 pt-8 md:order-1 md:col-span-7 md:pb-10 md:pl-0 md:pr-12 md:pt-14">
          <div>
            <p className="sign text-[14px] font-semibold text-tan">Catálogo de produtos · Preço do dia</p>
            <h1 className="sign relative mt-4 text-[64px] font-black leading-[0.8] tracking-[-0.01em] text-ink sm:text-[96px] md:text-[132px] lg:text-[158px]">
              Cortes
              <br />
              especiais
              <span className="font-script pointer-events-none absolute -right-[22%] top-[-6%] z-10 hidden -rotate-[9deg] text-[104px] normal-case leading-none tracking-normal text-[#f2d4cc] mix-blend-normal md:block lg:-right-[30%] lg:text-[132px]" aria-hidden>
                Atelier
              </span>
            </h1>
            <p className="mt-8 max-w-[34ch] text-[17px] leading-relaxed text-ink-2 md:text-[19px]">
              Escolha o corte, veja de onde ele sai e mande o pedido pronto no nosso WhatsApp. Preço atualizado todo dia, direto do balcão.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#kits" className="sign focus-ring inline-flex h-12 items-center gap-2 bg-red px-6 text-[17px] font-bold text-white transition hover:bg-red-bright">
                Ver os cortes <ArrowDownRight className="size-4" />
              </a>
              <a
                href={waLink(settings.whatsapp, "Olá! Vim pelo catálogo do Atelier da Carne.")}
                target="_blank"
                rel="noopener"
                className="sign focus-ring inline-flex h-12 items-center gap-2 border border-ink px-6 text-[17px] font-bold text-ink transition hover:bg-ink hover:text-bg"
              >
                <WhatsAppIcon className="size-4" /> Falar com a loja
              </a>
            </div>
          </div>

          {/* Créditos de pôster */}
          <dl className="mt-12 grid grid-cols-2 border-t border-line pt-5 text-[14px] md:grid-cols-3">
            <div className="pr-4">
              <dt className="sign text-[12px] font-semibold text-muted">Agora</dt>
              <dd className="mt-1">{status ? <StatusText status={status} className="text-[15px] text-ink" /> : <span className="sign text-[15px] font-semibold">{hours[0]}</span>}</dd>
            </div>
            <div className="border-l border-line pl-4 md:pr-4">
              <dt className="sign text-[12px] font-semibold text-muted">Horário</dt>
              {hours.map((h) => (
                <dd key={h} className="sign mt-1 text-[15px] font-semibold text-ink">{h}</dd>
              ))}
            </div>
            {settings.address && (
              <div className="col-span-2 mt-4 border-t border-line pt-4 md:col-span-1 md:mt-0 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                <dt className="sign text-[12px] font-semibold text-muted">Endereço</dt>
                <dd className="mt-1">
                  <a href={settings.maps_url ?? "#"} target="_blank" rel="noopener" className="sign text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-tan">
                    {settings.address}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      {settings.announcement && (
        <div className="border-t border-line">
          <p className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 text-[15px] text-ink md:px-8">
            <span className="size-2 shrink-0 bg-red" />
            {settings.announcement}
          </p>
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
  const items = [
    ...(hasKits ? [{ id: "kits", name: "Kits", n: "00" }] : []),
    ...categories.map((c, i) => ({ id: c.slug, name: c.name, n: pad(i + 1) })),
  ];

  useEffect(() => {
    const box = chipsRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (box && el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const go = (id: string) => {
    setQuery("");
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="sticky top-14 z-30 border-b border-line bg-bg">
      <div className="mx-auto max-w-[1320px] md:flex md:items-stretch md:px-8">
        <label className="relative flex items-center border-b border-line px-4 md:w-[340px] md:shrink-0 md:border-b-0 md:border-r md:pl-0 md:pr-4">
          <Search className="size-[18px] shrink-0 text-muted" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value && window.scrollY < 400) {
                const top = document.querySelector("main")!.getBoundingClientRect().top + window.scrollY - 120;
                window.scrollTo({ top, behavior: "smooth" });
              }
            }}
            placeholder="Buscar corte: picanha, costela, ancho"
            aria-label="Buscar produtos"
            className="h-13 w-full bg-transparent pl-3 pr-9 text-[16px] text-ink placeholder:italic placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Limpar busca"
              className="absolute right-3 grid size-8 place-items-center text-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
        <div ref={chipsRef} className="no-scrollbar relative flex overflow-x-auto px-1 md:px-0">
          {items.map((it) => {
            const on = !query && active === it.id;
            return (
              <button
                key={it.id}
                data-chip={it.id}
                onClick={() => go(it.id)}
                className={`sign focus-ring relative flex h-13 shrink-0 items-center gap-1.5 px-3.5 text-[16px] font-bold transition md:px-4 ${on ? "text-ink" : "text-muted hover:text-ink-2"}`}
              >
                <span className={`tabular text-[12px] ${on ? "text-tan" : "text-muted/70"}`}>{it.n}</span>
                {it.name}
                <span className={`absolute inset-x-3 bottom-0 h-[3px] transition ${on ? "bg-red" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ number, title, note, count }: { number: string; title: string; note?: string | null; count?: number }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-line pb-4">
      <div>
        <span className="mb-4 block h-[3px] w-12 bg-red" />
        <h2 className="sign text-[46px] font-extralight leading-[0.88] text-ink md:text-[84px]">
          <span className="mr-3 align-top text-[16px] font-bold text-tan md:text-[20px]">{number}</span>
          {title}
        </h2>
        {note && <p className="mt-3 text-[15px] italic text-muted md:text-[16px]">{note}</p>}
      </div>
      {count !== undefined && <p className="sign hidden shrink-0 text-[15px] font-semibold text-muted md:block">{count} cortes</p>}
    </div>
  );
}

function CategorySection({ category, number, onOpen }: { category: CategoryWithProducts; number: string; onOpen: (p: Product) => void }) {
  if (!category.products.length) return null;
  return (
    <section id={category.slug} data-section={category.slug} className="pt-16 md:pt-24">
      <div className="grid gap-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <SectionHead number={number} title={category.name} note={category.subtitle} count={category.products.length} />
        </div>
        {category.cover_url && (
          <div className="frame relative hidden aspect-[2/1] overflow-hidden md:col-span-5 md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={category.cover_url} alt="" loading="lazy" className="poster-img absolute inset-0 size-full object-cover" />
          </div>
        )}
      </div>
      <div className="mt-2 divide-y divide-line md:mt-8 md:grid md:grid-cols-3 md:gap-px md:divide-y-0 md:border md:border-line md:bg-line lg:grid-cols-4">
        {category.products.map((p) => (
          <ProductCard key={p.id} product={p} cover={category.cover_url} onOpen={onOpen} />
        ))}
        {/* completa a última linha da grade */}
        {Array.from({ length: (4 - (category.products.length % 4)) % 4 }).map((_, i) => (
          <div key={i} className="hidden bg-bg lg:block" />
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
    <section className="pt-10">
      {results.length ? (
        <>
          <p className="sign border-b border-line pb-4 text-[18px] font-semibold text-muted">
            <span className="tabular text-ink">{results.length}</span> {results.length === 1 ? "resultado" : "resultados"} para <span className="text-ink">“{query}”</span>
          </p>
          <div className="divide-y divide-line md:mt-6 md:grid md:grid-cols-3 md:gap-px md:divide-y-0 md:border md:border-line md:bg-line lg:grid-cols-4">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} cover={catById.get(p.category_id)?.cover_url} onOpen={onOpen} />
            ))}
          </div>
        </>
      ) : (
        <div className="border border-line px-6 py-16 text-center md:py-24">
          <p className="sign text-[44px] font-extralight leading-none text-ink md:text-[72px]">Não achamos “{query}”</p>
          <p className="mx-auto mt-4 max-w-md text-[16px] italic text-muted">Talvez esteja com outro nome. Também dá para encomendar.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {SEARCH_SUGGESTIONS.slice(0, 5).map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="sign text-[16px] font-bold text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
                {s}
              </button>
            ))}
          </div>
          <a href={waLink(whatsapp, `Olá! Vocês têm ${query}?`)} target="_blank" rel="noopener" className="sign mt-8 inline-flex h-12 items-center gap-2 bg-red px-6 text-[17px] font-bold text-white">
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
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <button onClick={() => setOpen(true)} className="flex h-16 w-full items-stretch text-white">
            <span className="sign flex flex-1 items-center gap-3 px-4 text-[18px] font-bold">
              <span className="tabular grid size-8 place-items-center border border-line-strong text-[15px]">{lines.length}</span>
              Ver pedido
            </span>
            <span className="sign tabular flex items-center bg-red px-5 text-[20px] font-extrabold">{brl(total)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Footer({ settings }: { settings: Catalog["settings"] }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1320px] px-4 md:px-8">
        <div className="flex items-end justify-between gap-6 border-b border-line py-12 md:py-16">
          <p className="sign text-[15vw] font-extralight leading-[0.8] text-ink md:text-[128px]">
            Atelier
            <br />
            da Carne
          </p>
          <LogoMark className="hidden h-36 w-auto opacity-90 md:block" />
        </div>
        <div className="grid gap-8 py-10 md:grid-cols-3">
          <div>
            <h3 className="sign text-[15px] font-bold text-tan">Horário</h3>
            <ul className="mt-3 space-y-1">
              {hoursSummary(settings.hours).map((h) => (
                <li key={h} className="sign text-[18px] font-semibold text-ink">{h}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="sign text-[15px] font-bold text-tan">Endereço</h3>
            {settings.address && (
              <a href={settings.maps_url ?? "#"} target="_blank" rel="noopener" className="mt-3 inline-flex items-start gap-1 text-[16px] text-ink-2 hover:text-ink">
                {settings.address} <ArrowUpRight className="mt-1 size-3.5 shrink-0" />
              </a>
            )}
          </div>
          <div>
            <h3 className="sign text-[15px] font-bold text-tan">Contato</h3>
            <div className="mt-3 flex flex-col gap-2 text-[16px]">
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-[13px] italic text-muted">
          <span>Produtos por quilo são pesados na hora. Fotos ilustrativas.</span>
          <a href="/admin" className="sign not-italic font-semibold hover:text-ink">Portal da loja</a>
        </div>
      </div>
    </footer>
  );
}
