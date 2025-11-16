// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import SiteHeader from "./components/SiteHeader";

export const metadata: Metadata = {
  title: "Mi Portal de Noticias",
  description: "Portal interno / demo político",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="bg-neutral-950 text-neutral-100">
      <body className="bg-neutral-950 text-neutral-100 antialiased min-h-screen">
        <Providers>
          {/* HEADER GLOBAL PARA TODO EL SITIO (lectores) */}
          <SiteHeader />

          {/* CONTENIDO */}
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

          {/* FOOTER GLOBAL */}
          <footer className="border-t border-neutral-800 text-center text-[11px] text-neutral-600 mt-10 py-6">
            <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-neutral-500">
                v0.1 / uso interno / demo editorial
              </div>
              <div className="text-neutral-700">
                Hecho en Next.js + NestJS + MySQL
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
