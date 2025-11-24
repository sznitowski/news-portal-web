// app/admin/page.tsx
"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-16 pb-12 md:pt-20">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 text-slate-900 shadow-[0_25px_60px_rgba(15,23,42,0.16)]">
        {/* Glow suave, colores acordes a la portada */}
        <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),transparent_60%)]" />

        <div className="relative z-10 grid gap-10 p-6 md:p-8 lg:p-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
          {/* Columna izquierda */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase text-violet-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Canalibertario · Panel editorial
            </div>

            <div>
              <h1 className="mb-2 text-2xl font-semibold leading-tight md:text-3xl">
                Bienvenido al panel editorial
              </h1>
              <p className="max-w-xl text-sm text-slate-600">
                Usá el menú superior <strong>“Panel editorial”</strong> para
                acceder a las distintas acciones: edición de notas y publicación
                desde imagen con IA.
              </p>
            </div>

            {/* Atajo rápido */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Atajo rápido
              </div>
              <p className="mb-1 text-sm text-slate-700">
                Si querés ver cómo se ve la portada pública, podés ir a
                <Link
                  href="/"
                  className="ml-1 font-semibold text-sky-600 underline decoration-dotted hover:text-sky-500"
                >
                  Ver portada.
                </Link>
              </p>
              <p className="text-xs text-slate-500">
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
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.10)] transition-colors hover:border-sky-400/70 hover:bg-white"
              >
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                  ¿Qué podés hacer desde este panel?
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Edición de notas
                </h2>
                <p className="text-xs text-slate-600">
                  Administrás las notas ya creadas (publicadas, borradores,
                  archivadas) desde el listado principal.
                </p>
                <p className="mt-1 text-xs font-semibold text-sky-600">
                  Ir a edición de notas →
                </p>
              </Link>

              {/* Publicar desde imagen IA */}
              <Link
                href="/admin/from-image-ai"
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.10)] transition-colors hover:border-violet-400/70 hover:bg-white"
              >
                <h2 className="text-sm font-semibold text-slate-900">
                  Publicar desde imagen (IA)
                </h2>
                <p className="text-xs text-slate-600">
                  Subís una captura, la IA sugiere título, resumen y cuerpo, e
                  inserta la imagen en la nota para que sólo tengas que afinar
                  el texto.
                </p>
                <p className="mt-1 text-xs font-semibold text-violet-600">
                  Cargar desde imagen (IA) →
                </p>
              </Link>
            </div>

            {/* Tarjetas chicas abajo */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                <div className="mb-1 font-semibold text-slate-900">
                  Próximas mejoras
                </div>
                <p>
                  Módulo de estadísticas rápidas, estado del scraping y alertas
                  de errores.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                <div className="mb-1 font-semibold text-slate-900">
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
