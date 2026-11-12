import Image from "next/image";

export function LogoMark({ className = "h-8 w-auto", priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo-mark.png"
      alt=""
      width={337}
      height={417}
      className={className}
      priority={priority}
    />
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={compact ? "h-7 w-auto" : "h-9 w-auto"} priority />
      <span className="leading-none">
        <span className="font-display block text-[17px] font-semibold tracking-wide text-ink">Atelier da Carne</span>
        {!compact && (
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.28em] text-tan">Catálogo</span>
        )}
      </span>
    </span>
  );
}
