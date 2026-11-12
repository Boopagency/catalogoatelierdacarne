import Link from "next/link";
import { Wordmark } from "@/components/ui/logo";

export function SetupNotice() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="flex justify-center"><Wordmark /></div>
        <h1 className="font-display mt-8 text-3xl text-ink">Portal ainda não conectado</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          O catálogo está no ar em modo demonstração. Para editar preços e receber pedidos aqui, conecte o banco
          Supabase configurando <code className="text-tan">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code className="text-tan">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> na Vercel.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-ink underline underline-offset-4">Voltar ao catálogo</Link>
      </div>
    </div>
  );
}
