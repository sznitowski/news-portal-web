// app/admin/editor/page.tsx
"use client";

import Link from "next/link";
import EditorialArticlesTable from "../../api/editor/articles/EditorialArticlesTable";
import { FacebookPublishButton } from "../../components/admin/FacebookPublishButton";

export default function AdminEditorPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-900/80 bg-slate-950/95 text-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.95)]">
        {/* Glow sobrio consistente con el dashboard */}
        <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.30),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),transparent_60%)]" />

        <section className="relative z-10 space-y-5 p-6 md:p-8 lg:p-10">
          {/* Header + CTAs */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                Gestión de contenido
              </div>
              <h1 className="mb-1 text-2xl font-semibold">Edición de notas</h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Acá podés ver y cambiar el estado de las notas (publicadas,
                borradores, archivadas) del portal. Los cambios impactan
                directamente en la portada.
              </p>

              {/* Botón de prueba: publicar artículo 1 en Facebook (simulado) */}
              <div className="mt-4">
                <p className="mb-1 text-xs text-slate-400">
                  Acción rápida de prueba: publicar en Facebook (simulado) la
                  nota con ID 1.
                </p>
                <FacebookPublishButton
                  articleId={1}
                  title="Prueba desde panel"
                  summary={null}
                  coverImageUrl={null}
                />
              </div>
            </div>

            {/* Botones de atajo a otros flujos IA */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/from-image-ai"
                className="inline-flex items-center justify-center rounded-full bg-fuchsia-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_45px_rgba(217,70,239,0.55)] transition hover:bg-fuchsia-400"
              >
                Cargar artículo desde imagen (IA)
              </Link>

              {/* ➜ NUEVO: editor de imágenes IA */}
              <Link
                href="/admin/image-editor"
                className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-100 shadow-[0_16px_35px_rgba(0,0,0,0.55)] transition hover:border-emerald-400/70 hover:text-emerald-200"
              >
                Editor de imágenes (IA)
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3 text-xs text-slate-300">
            Tip: usá los filtros de la tabla para encontrar rápido las notas por
            categoría, fecha o estado editorial.
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3 md:p-4 shadow-[0_22px_55px_rgba(0,0,0,0.75)]">
            <EditorialArticlesTable />
          </div>
        </section>
      </div>
    </main>
  );
}
