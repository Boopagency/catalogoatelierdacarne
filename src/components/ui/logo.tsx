import Image from "next/image";

export function LogoMark({ className = "h-8 w-auto", priority }: { className?: string; priority?: boolean }) {
  return <Image src="/brand/logo-mark.png" alt="" width={337} height={417} className={className} priority={priority} />;
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={compact ? "h-7 w-auto" : "h-10 w-auto"} priority />
      <span className="sign whitespace-nowrap text-[17px] font-extrabold leading-none tracking-[0.05em] text-ink sm:text-[19px]">Atelier da Carne</span>
    </span>
  );
}
