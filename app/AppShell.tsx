// app/AppShell.tsx
"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./components/SiteHeader";

type Props = {
  children: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const pathname = usePathname();

  // Rutas donde NO queremos header/footer (sólo el bloque del editor)
  const isImageEditorEmbed = pathname === "/admin/image-editor-embed";

  if (isImageEditorEmbed) {
    // Full-bleed, sin header ni footer
    return <>{children}</>;
  }

  // Layout normal del sitio
  return (
    <>
      {/* HEADER GLOBAL */}
      <SiteHeader />

      {/* CONTENIDO */}
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-0">{children}</main>

      {/* FOOTER */}
      <footer className="mt-10 border-t border-slate-200 py-6 text-center text-[11px] text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <div>v0.1 / uso interno / demo editorial</div>
          <div>Hecho en Next.js + NestJS + MySQL</div>
        </div>
      </footer>
    </>
  );
}
