// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import AppShell from "./AppShell";

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
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
