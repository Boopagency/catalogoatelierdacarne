"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useIsDesktop } from "./use-media";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** "center": modal centralizado no desktop; "right": gaveta lateral no desktop. Sempre bottom sheet no mobile. */
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
        ? { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 } }
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
      ? "md:inset-y-0 md:right-0 md:left-auto md:top-0 md:h-dvh md:max-h-none md:w-[460px] md:rounded-none md:border-l"
      : `md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[88dvh] md:rounded-3xl md:border ${
          wide ? "md:w-[min(980px,calc(100vw-48px))]" : "md:w-[min(640px,calc(100vw-48px))]"
        }`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className={`absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col overflow-hidden rounded-t-[28px] border-t border-line-strong bg-surface shadow-2xl shadow-black/60 ${desktop}`}
            {...anim}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
          >
            <div className="flex justify-center pt-2.5 md:hidden" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-ink/20" />
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="focus-ring absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-black/40 text-ink/80 backdrop-blur transition hover:bg-black/60 hover:text-ink"
            >
              <X className="size-5" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
