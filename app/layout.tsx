// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import AppShell from "./AppShell";
import { siteBrand } from "./components/branding/siteBrand";

export const metadata: Metadata = {
  title: {
    default: siteBrand.name,
    template: `%s · ${siteBrand.shortName}`,
  },
  description: siteBrand.claim,
  applicationName: siteBrand.name,
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
