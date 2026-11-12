"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useIsDesktop } from "./use-media";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** "center": painel centralizado no desktop; "right": gaveta lateral. No celular, sobe de baixo. */
  side?: "center" | "right";
  label: string;
  wide?: boolean;
};

export function Sheet({ open, onClose, children, side = "center", label, wide }: Props) {
  const isDesktop = useIsDesktop();
  const anim =
    isDesktop && side === "right"
      ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
      : isDesktop
        ? { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 16 } }
        : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const desktop =
    side === "right"
      ? "md:inset-y-0 md:right-0 md:left-auto md:top-0 md:h-dvh md:max-h-none md:w-[480px] md:border-l md:border-t-0"
      : `md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[90dvh] md:border ${
          wide ? "md:w-[min(1180px,calc(100vw-48px))]" : "md:w-[min(640px,calc(100vw-48px))]"
        }`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
          <motion.div
            className="absolute inset-0 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={`absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col overflow-hidden border-t border-line-strong bg-bg ${desktop}`}
            {...anim}
            transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.38 }}
          >
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="focus-ring absolute right-0 top-0 z-10 grid size-12 place-items-center border-b border-l border-line-strong bg-bg text-ink transition hover:bg-red"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
