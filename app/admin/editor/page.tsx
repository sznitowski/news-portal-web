// app/admin/editor/page.tsx
"use client";

import EditorialArticlesTable from "../../api/editor/articles/EditorialArticlesTable";

export default function AdminEditorPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/80 text-slate-50 shadow-[0_40px_90px_rgba(0,0,0,0.75)]">
        <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.22),transparent_60%)]" />

        <section className="relative z-10 p-6 md:p-8 lg:p-10 space-y-5">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
              Gestión de contenido
            </div>
            <h1 className="text-2xl font-semibold mb-1">Edición de notas</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Acá podés ver y cambiar el estado de las notas (publicadas,
              borradores, archivadas) del portal. Los cambios impactan
              directamente en la portada.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3 text-xs text-slate-300">
            Tip: usá los filtros de la tabla para encontrar rápido las notas por
            categoría, fecha o estado editorial.
          </div>

          <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3 md:p-4 shadow-[0_22px_55px_rgba(0,0,0,0.65)]">
            <EditorialArticlesTable />
          </div>
        </section>
      </div>
    </main>
  );
}
