"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { search, SEARCH_SUGGESTIONS, type SearchDoc } from "@/lib/search";
import type { CategoryWithProducts, Product } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";
import { ProductCard } from "./product-card";

export type SearchOverlayHandle = { open: () => void };

type Props = {
  index: SearchDoc[];
  categories: CategoryWithProducts[];
  catById: Map<string, CategoryWithProducts>;
  onOpenProduct: (p: Product) => void;
  onGoTo: (id: string) => void;
  whatsapp: string;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Busca do celular em tela cheia. Fica sempre montada (invisível) para que o
 * campo possa receber foco dentro do toque: é isso que faz o iPhone abrir o teclado.
 */
export const SearchOverlay = forwardRef<SearchOverlayHandle, Props>(function SearchOverlay(
  { index, categories, catById, onOpenProduct, onGoTo, whatsapp, onOpenChange },
  ref
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => search(index, query).map((r) => r.product), [index, query]);

  useImperativeHandle(ref, () => ({
    open: () => {
      history.scrollRestoration = "manual";
      setOpen(true);
      // foco síncrono, ainda dentro do toque do usuário
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.select();
      history.pushState({ atelierSearch: true }, "");
    },
  }));

  useEffect(() => {
    onOpenChange?.(open);
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("popstate", onPop);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [query]);

  const close = () => {
    inputRef.current?.blur();
    setOpen(false);
    if (history.state?.atelierSearch) history.back();
  };

  const goTo = (id: string) => {
    close();
    setTimeout(() => onGoTo(id), 120);
  };

  return (
    <div
      className={`fixed inset-0 z-[45] flex flex-col bg-bg transition-opacity duration-200 md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      aria-hidden={!open}
      role="dialog"
      aria-label="Buscar produtos"
    >
      <form
        className="flex h-16 shrink-0 items-center border-b border-line-strong pl-4"
        onSubmit={(e) => {
          e.preventDefault();
          inputRef.current?.blur();
        }}
      >
        <Search className="size-5 shrink-0 text-tan" strokeWidth={1.75} />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Picanha, costela, linguiça..."
          aria-label="Buscar produtos"
          tabIndex={open ? 0 : -1}
          className="h-full min-w-0 flex-1 bg-transparent pl-3 pr-2 text-[17px] text-ink placeholder:italic placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Limpar" className="grid size-11 shrink-0 place-items-center text-muted">
            <X className="size-5" />
          </button>
        )}
        <button type="button" onClick={close} tabIndex={open ? 0 : -1} className="sign h-full shrink-0 border-l border-line px-4 text-[16px] font-bold text-ink-2">
          Fechar
        </button>
      </form>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-32"
        onTouchMove={() => inputRef.current?.blur()}
      >
        {!query.trim() ? (
          <>
            <p className="sign pb-2 pt-6 text-[14px] font-bold text-muted">Mais procurados</p>
            <div className="flex flex-wrap gap-2">
              {SEARCH_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="sign h-11 border border-line-strong px-4 text-[17px] font-bold text-ink active:bg-surface-2"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="sign pb-1 pt-8 text-[14px] font-bold text-muted">Categorias</p>
            <ul>
              <li>
                <button onClick={() => goTo("kits")} className="sign flex h-14 w-full items-center justify-between border-b border-line text-left text-[22px] font-bold text-ink">
                  <span><span className="mr-3 text-[13px] text-tan">00</span>Kits e promoções</span>
                </button>
              </li>
              {categories.map((c, i) => (
                <li key={c.id}>
                  <button onClick={() => goTo(c.slug)} className="sign flex h-14 w-full items-center justify-between border-b border-line text-left text-[22px] font-bold text-ink">
                    <span>
                      <span className="mr-3 text-[13px] text-tan">{String(i + 1).padStart(2, "0")}</span>
                      {c.name}
                    </span>
                    <span className="sign text-[14px] font-semibold text-muted">{c.products.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : results.length ? (
          <>
            <p className="sign border-b border-line py-3 text-[15px] font-semibold text-muted">
              <span className="tabular text-ink">{results.length}</span> {results.length === 1 ? "resultado" : "resultados"}
            </p>
            <div className="divide-y divide-line">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} cover={catById.get(p.category_id)?.cover_url} onOpen={onOpenProduct} />
              ))}
            </div>
          </>
        ) : (
          <div className="pt-12">
            <p className="sign text-[36px] font-extralight leading-none text-ink">Não achamos “{query}”</p>
            <p className="mt-3 text-[16px] italic text-muted">Pode estar com outro nome, ou dá para encomendar.</p>
            <a
              href={waLink(whatsapp, `Olá! Vocês têm ${query}?`)}
              target="_blank"
              rel="noopener"
              className="sign mt-6 inline-flex h-12 items-center gap-2 bg-red px-5 text-[17px] font-bold text-white"
            >
              <WhatsAppIcon className="size-4" /> Perguntar no WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
});
