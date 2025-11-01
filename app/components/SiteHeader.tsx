// app/components/SiteHeader.tsx

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-5xl px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <div>
            <h1 className="text-xl font-semibold text-neutral-100 leading-tight">
              Mi Portal de Noticias
            </h1>
            <p className="text-[12px] text-neutral-400">
              Últimas publicaciones (scrapeadas → limpiadas → etiquetadas
              "RIGHT")
            </p>
          </div>

          <nav className="text-[12px] text-neutral-400 flex flex-row gap-4">
            <span className="cursor-pointer hover:text-neutral-200">
              Política
            </span>
            <span className="cursor-pointer hover:text-neutral-200">
              Economía
            </span>
            <span className="cursor-pointer hover:text-neutral-200">
              Internacional
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
}
