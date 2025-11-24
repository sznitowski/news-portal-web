"use client";

import { useState, ChangeEvent } from "react";

export default function ImageEditorPage() {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/90 text-slate-50 shadow-[0_40px_90px_rgba(0,0,0,0.80)]">
        {/* Glow similar al resto del panel oscuro */}
        <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.28),transparent_60%)]" />

        <div className="relative z-10 space-y-8 p-6 md:p-8 lg:p-10">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
              Editor de imágenes · IA
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
              Preparar imagen de portada con IA
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Subí una imagen para usarla como portada y, en los próximos pasos,
              vamos a sumar filtros y ajustes automáticos con IA (recorte,
              contraste, texto superpuesto, etc.).
            </p>
          </header>

          {/* Bloque de carga de imagen */}
          <section className="grid gap-6 rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)] md:p-6">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">
                1. Cargar imagen base
              </h2>
              <p className="text-xs text-slate-300">
                Elegí una imagen desde tu dispositivo. La idea es que sea la
                base para la portada de la nota.
              </p>

              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-50 hover:border-emerald-300/70 hover:bg-slate-800">
                Seleccionar imagen de portada
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <p className="text-[11px] text-slate-400">
                Formatos recomendados: JPG o PNG, proporción 16:9 o similar.
              </p>

              <div className="mt-2 rounded-xl border border-dashed border-slate-600 bg-slate-900/70 p-3 text-[11px] text-slate-300">
                Próximamente acá vamos a agregar:
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>Botón “Mejorar imagen con IA”.</li>
                  <li>Opciones de recorte automático para portada.</li>
                  <li>Superposición de texto / cintas con título.</li>
                </ul>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-50">
                2. Vista previa
              </h2>
              <div className="flex items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/80 p-3">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview portada"
                    className="max-h-72 w-full rounded-xl object-cover"
                  />
                ) : (
                  <p className="text-xs text-slate-400">
                    Todavía no cargaste ninguna imagen. Seleccioná una para ver
                    cómo se vería como portada.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-700/70 px-4 py-2 text-xs font-semibold text-slate-300 disabled:cursor-not-allowed"
              >
                Mejorar imagen con IA (próximamente)
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
