import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Inika, La_Belle_Aurore } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Big Shoulders: nasceu da sinalização de Chicago, a "Hog Butcher for the World".
const shoulders = Big_Shoulders({
  subsets: ["latin"],
  variable: "--font-shoulders",
  axes: ["opsz"],
  display: "swap",
});

// Inika: serifa slab com cara de papel de açougue.
const inika = Inika({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inika",
  display: "swap",
});

// Assinatura manuscrita, usada só em detalhes.
const script = La_Belle_Aurore({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script-hand",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Atelier da Carne · Catálogo",
    template: "%s · Atelier da Carne",
  },
  description:
    "Catálogo do Atelier da Carne: cortes especiais, bovinos, suínos, frango, linguiças, hambúrgueres e kits. Monte seu pedido e envie pelo WhatsApp.",
  icons: {
    icon: [{ url: "/brand/icon-192.png", sizes: "192x192" }],
    apple: "/brand/apple-icon.png",
  },
  openGraph: {
    title: "Atelier da Carne · Catálogo de produtos",
    description: "Cortes especiais com preço do dia. Monte seu pedido e envie pelo WhatsApp.",
    images: ["/brand/og.jpg"],
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0e0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${shoulders.variable} ${inika.variable} ${script.variable}`}>
      <body className="grain min-h-dvh">
        <div className="relative z-[1]">{children}</div>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "#181615",
              border: "1px solid rgb(217 217 217 / 0.3)",
              borderRadius: 0,
              color: "#ffffff",
              fontFamily: "var(--font-inika)",
            },
          }}
        />
      </body>
    </html>
  );
}
