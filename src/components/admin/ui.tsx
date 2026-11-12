"use client";

import { forwardRef, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/admin";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "light";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  const v = {
    primary: "bg-red text-white hover:bg-red-bright",
    light: "bg-ink text-bg hover:bg-white",
    secondary: "border border-line-strong bg-surface-2 text-ink hover:bg-surface-3",
    ghost: "text-ink-2 hover:bg-surface-3 hover:text-ink",
    danger: "border border-red/40 text-red-bright hover:bg-red/10",
  }[variant];
  const s = size === "sm" ? "h-9 px-3 text-[13px]" : "h-11 px-4 text-sm";
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[.98] disabled:opacity-50 ${v} ${s} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export const inputCls =
  "focus-ring h-11 w-full rounded-xl border border-line-strong bg-bg-2 px-3.5 text-[15px] text-ink placeholder:text-muted/60 disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...props },
  ref
) {
  return <input ref={ref} {...props} className={`${inputCls} ${className}`} />;
});

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`focus-ring w-full resize-y rounded-xl border border-line-strong bg-bg-2 px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/60 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} appearance-none bg-[length:16px] ${props.className ?? ""}`} />;
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`focus-ring relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? "bg-ok" : "bg-surface-3 ring-1 ring-line-strong"}`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[32px] font-semibold leading-none text-ink md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ImagePicker({
  value,
  onChange,
  folder,
  aspect = "aspect-[4/3]",
  label = "Foto",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  aspect?: string;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadImage(f, folder));
      toast.success("Foto enviada");
    } catch (e) {
      toast.error("Não foi possível enviar a foto", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      <div
        className={`relative ${aspect} overflow-hidden rounded-2xl border border-dashed border-line-strong bg-bg-2`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => ref.current?.click()} loading={busy}>
                Trocar
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => onChange(null)} aria-label="Remover foto">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted transition hover:text-ink"
          >
            {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            {busy ? "Enviando…" : "Toque para enviar uma foto"}
            <span className="text-xs text-muted/70">ou arraste aqui · JPG, PNG ou WEBP</span>
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />;
}
