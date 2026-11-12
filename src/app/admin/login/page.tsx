import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupNotice } from "@/components/admin/setup-notice";

export const metadata: Metadata = { title: "Entrar no portal", robots: { index: false } };

export default function LoginPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  return <LoginForm />;
}
