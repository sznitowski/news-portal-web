//app/admin/page.tsx
"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/80 text-slate-50 shadow-[0_40px_90px_rgba(0,0,0,0.75)]">
        {/* Glow de color */}
        <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.22),transparent_60%)]" />

        <div className="relative z-10 grid gap-10 p-6 md:p-8 lg:p-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
          {/* Columna izquierda */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Info libertario · Panel editorial
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-semibold leading-tight mb-2">
                Bienvenido al panel editorial
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Usá el menú superior <strong>“Panel editorial”</strong> para
                acceder a las distintas acciones: edición de notas y publicación
                desde imagen con IA.
              </p>
            </div>

            {/* Atajo rápido */}
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 mb-1 uppercase">
                Atajo rápido
              </div>
              <p className="text-sm text-slate-200 mb-1">
                Si querés ver cómo se ve la portada pública, podés ir a
                <Link
                  href="/"
                  className="ml-1 font-semibold text-emerald-300 hover:text-emerald-200 underline decoration-dotted"
                >
                  Ver portada.
                </Link>
              </p>
              <p className="text-xs text-slate-400">
                Más adelante acá podemos sumar estadísticas rápidas (visitas,
                últimas notas, errores de scraping, etc.).
              </p>
            </div>
          </div>

          {/* Columna derecha: accesos */}
          <div className="space-y-4">
            <div className="space-y-3">
              {/* Edición de notas */}
              <Link
                href="/admin/editor"
                className="block rounded-2xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.5)] hover:border-emerald-400/60 hover:bg-slate-900/90 transition-colors"
              >
                <div className="text-xs font-semibold tracking-[0.18em] text-emerald-300 uppercase mb-1">
                  ¿Qué podés hacer desde este panel?
                </div>
                <h2 className="text-sm font-semibold text-slate-50">
                  Edición de notas
                </h2>
                <p className="text-xs text-slate-300">
                  Administrás las notas ya creadas (publicadas, borradores,
                  archivadas) desde el listado principal.
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-300">
                  Ir a edición de notas →
                </p>
              </Link>

              {/* Publicar desde imagen IA */}
              <Link
                href="/admin/from-image-ai"
                className="block rounded-2xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.5)] hover:border-purple-400/60 hover:bg-slate-900/90 transition-colors"
              >
                <h2 className="text-sm font-semibold text-slate-50">
                  Publicar desde imagen (IA)
                </h2>
                <p className="text-xs text-slate-300">
                  Subís una captura, la IA sugiere título, resumen y cuerpo, e
                  inserta la imagen en la nota para que sólo tengas que afinar
                  el texto.
                </p>
                <p className="mt-1 text-xs font-semibold text-purple-300">
                  Cargar desde imagen (IA) →
                </p>
              </Link>
            </div>

            {/* Tarjetas chicas abajo */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 px-3 py-3 text-xs text-slate-300">
                <div className="font-semibold text-slate-50 mb-1">
                  Próximas mejoras
                </div>
                <p>
                  Módulo de estadísticas rápidas, estado del scraping y alertas
                  de errores.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 px-3 py-3 text-xs text-slate-300">
                <div className="font-semibold text-slate-50 mb-1">
                  Flujo editorial
                </div>
                <p>
                  Estados de revisión, QA, publicación programada y alertas para
                  el equipo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
