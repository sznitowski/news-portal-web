import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import SiteHeader from "./components/SiteHeader";

export const metadata: Metadata = {
  title: "CanaLibertario",
  description: "Noticias · Economía · Política",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <Providers>
          {/* HEADER GLOBAL */}
          <SiteHeader />

          {/* CONTENIDO */}
          {/* OJO: sin pt-6 para que el submenú quede pegado al header */}
          <main className="mx-auto max-w-5xl px-4 pb-10 pt-0">
            {children}
          </main>

          {/* FOOTER */}
          <footer className="mt-10 border-t border-slate-200 py-6 text-center text-[11px] text-slate-500">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
              <div>v0.1 / uso interno / demo editorial</div>
              <div>Hecho en Next.js + NestJS + MySQL</div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
