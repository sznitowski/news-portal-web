// app/admin/editor/page.tsx
"use client";

import EditorialArticlesTable from "../../api/editor/articles/EditorialArticlesTable";

export default function AdminEditorPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-zinc-950/95 text-zinc-50 shadow-[0_32px_90px_rgba(0,0,0,0.85)]">
        {/* Sin gradiente, fondo gris/negro sólido */}

        <section className="relative z-10 space-y-5 p-6 md:p-8 lg:p-10">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Gestión de contenido
            </div>
            <h1 className="mb-1 text-2xl font-semibold">Edición de notas</h1>
            <p className="max-w-2xl text-sm text-zinc-300">
              Acá podés ver y cambiar el estado de las notas (publicadas,
              borradores, archivadas) del portal. Los cambios impactan
              directamente en la portada.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/95 px-4 py-3 text-[11px] text-zinc-300">
            <span className="font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Tip
            </span>{" "}
            <span>
              usá los filtros de la tabla para encontrar rápido las notas por
              categoría, fecha o estado editorial.
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800/90 bg-zinc-950/95 p-3 md:p-4 shadow-[0_22px_55px_rgba(0,0,0,0.8)]">
            <EditorialArticlesTable />
          </div>
        </section>
      </div>
    </main>
  );
}
