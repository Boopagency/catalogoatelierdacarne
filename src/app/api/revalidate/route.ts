import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

/** Atualiza o catálogo público na hora, depois de uma edição no portal. */
export async function POST() {
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: false }, { status: 400 });
  const sb = await supabaseServer();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: admin } = await sb.rpc("is_admin");
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 });
  revalidatePath("/");
  revalidatePath("/pedido/[code]", "page");
  return NextResponse.json({ ok: true });
}
