// app/AppShell.tsx
"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./components/SiteHeader";

type Props = {
  children: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const pathname = usePathname();

  // Rutas especiales
  const isImageEditorEmbed = pathname === "/admin/multimedia/image-editor-embed";
  const isFromImageAI = pathname === "/admin/from-image-ai";

  // 1) Editor embebido → sin header ni footer
  if (isImageEditorEmbed) {
    return <>{children}</>;
  }

  // 2) Página "Cargar artículo desde imagen (IA)" → full width
  if (isFromImageAI) {
    return (
      <>
        <SiteHeader />

        {/* full width, sin max-w */}
        <main className="w-full px-4 pb-10 pt-0">{children}</main>

        <footer className="mt-10 border-t border-slate-200 py-6 text-center text-[11px] text-slate-500">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
            <div>v0.1 / uso interno / demo editorial</div>
            <div>Hecho en Next.js + NestJS + MySQL</div>
          </div>
        </footer>
      </>
    );
  }

  // 3) Resto del sitio → layout normal
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-10 pt-0">{children}</main>

      <footer className="mt-10 border-t border-slate-200 py-6 text-center text-[11px] text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <div>v0.1 / uso interno / demo editorial</div>
          <div>Hecho en Next.js + NestJS + MySQL</div>
        </div>
      </footer>
    </>
  );
}
