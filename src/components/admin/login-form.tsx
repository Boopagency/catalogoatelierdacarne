"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LogoMark } from "@/components/ui/logo";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button, Field, Input } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      return toast.error("E-mail ou senha incorretos");
    }
    const { data: admin } = await sb.rpc("is_admin");
    if (!admin) {
      await sb.auth.signOut();
      setLoading(false);
      return toast.error("Este usuário não tem acesso ao portal");
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 50% at 50% 30%, rgba(140,16,16,.35), transparent 70%)" }} />
      <form onSubmit={submit} className="relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-20 w-auto" priority />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-tan">Portal da loja</p>
          <h1 className="font-display mt-2 text-4xl font-semibold text-ink">Atelier da Carne</h1>
        </div>
        <div className="mt-10 space-y-4 rounded-3xl border border-line bg-surface/80 p-6 backdrop-blur">
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </Field>
          <Field label="Senha">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>Entrar</Button>
        </div>
      </form>
    </div>
  );
}
