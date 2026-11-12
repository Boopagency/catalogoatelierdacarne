import type { Metadata, Viewport } from "next";
import { Fraunces, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
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
    "Catálogo do Atelier da Carne: cortes premium, bovinos, suínos, frango, linguiças, hambúrgueres e kits. Monte seu pedido e envie pelo WhatsApp.",
  icons: {
    icon: [{ url: "/brand/icon-192.png", sizes: "192x192" }],
    apple: "/brand/apple-icon.png",
  },
  openGraph: {
    title: "Atelier da Carne · Catálogo de produtos",
    description: "Cortes especiais e preços sempre atualizados. Monte seu pedido e envie pelo WhatsApp.",
    images: ["/brand/og.jpg"],
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0908",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${poppins.variable}`}>
      <body className="grain min-h-dvh">
        <div className="relative z-[1]">{children}</div>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "#201a16",
              border: "1px solid rgb(243 235 224 / 0.12)",
              color: "#f3ebe0",
              fontFamily: "var(--font-poppins)",
            },
          }}
        />
      </body>
    </html>
  );
}
