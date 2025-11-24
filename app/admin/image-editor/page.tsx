// app/admin/image-editor/page.tsx
"use client";

import { useState, ChangeEvent } from "react";

type EnhanceResponse = {
  enhancedImageUrl: string;
  message?: string;
  overlay?: {
    title?: string | null;
    subtitle?: string | null;
    footer?: string | null;
  };
};

export default function AdminImageEditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [footer, setFooter] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResultUrl(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    const objectUrl = URL.createObjectURL(f);
    setPreviewUrl(objectUrl);
  };

  const handleEnhance = async () => {
    if (!file) {
      setErrorMsg("Primero seleccioná una imagen base.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const fd = new FormData();
      fd.append("image", file);

      // Token de acceso que ya usás en el resto del front
      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("news_access_token");
        if (token) {
          fd.append("accessToken", token);
        }
      }

      // Opciones para la IA / overlay
      fd.append(
        "optionsJson",
        JSON.stringify({
          title: title.trim() || null,
          subtitle: subtitle.trim() || null,
          footer: footer.trim() || null,
        }),
      );

      const res = await fetch("/api/editor-images/enhance", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text || `Error HTTP ${res.status} al procesar la imagen`,
        );
      }

      const data = (await res.json()) as EnhanceResponse;

      if (data.enhancedImageUrl) {
        setResultUrl(data.enhancedImageUrl);
        setSuccessMsg(
          data.message ??
            "Imagen procesada correctamente. Usala como portada en tus notas.",
        );
      } else {
        setErrorMsg("La respuesta no contiene una URL de imagen procesada.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Error al procesar la imagen con IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-900/80 bg-slate-950/95 text-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.95)]">
        {/* Glow sobrio */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),transparent_60%)] opacity-80" />

        <section className="relative z-10 space-y-6 p-6 md:p-8 lg:p-10">
          {/* Header */}
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Editor de imágenes · IA
            </div>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
              Preparar imagen de portada con IA
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Subí una imagen para usarla como portada y definí el título, la
              bajada y la info del canal que quieras superponer con IA.
            </p>
          </header>

          <div className="grid gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 md:grid-cols-2 md:p-6">
            {/* Columna izquierda: carga + textos */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                1. Cargar imagen base
              </div>

              <p className="text-xs text-slate-300">
                Elegí una imagen desde tu dispositivo. La idea es que sea la
                base para la portada de la nota.
              </p>

              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-50 hover:border-sky-400/80 hover:bg-slate-800">
                Seleccionar imagen de portada
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <p className="text-[11px] text-slate-400">
                Formatos recomendados: JPG o PNG, proporción 16:9 o similar.
              </p>

              {/* Textos para la portada */}
              <div className="mt-3 space-y-3 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Textos de la portada
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    Título principal
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    placeholder="Ej: Milei anuncia la eliminación del cepo"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    Bajada / descripción corta
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    placeholder="Ej: Gran anuncio económico"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    Pie / info del canal
                  </label>
                  <input
                    type="text"
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    placeholder="Ej: CANALIBERTARIO · INFO LIBERTARIA"
                  />
                </div>
              </div>
            </div>

            {/* Columna derecha: preview + resumen de textos + resultado */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                2. Vista previa
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] text-slate-300">
                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-400">
                      Vista previa de la imagen base seleccionada:
                    </div>
                    <img
                      src={previewUrl}
                      alt="Preview portada"
                      className="max-h-64 w-full rounded-lg border border-slate-800 object-cover"
                    />
                  </div>
                ) : (
                  <p>
                    Todavía no cargaste ninguna imagen. Seleccioná una para ver
                    cómo se vería como portada.
                  </p>
                )}
              </div>

              {/* Resumen de textos que se mandan a la IA */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-[11px] text-slate-300">
                <div className="mb-1 text-[11px] font-semibold text-slate-200">
                  Textos que se enviarán a la IA:
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold text-slate-100">
                      Título:
                    </span>{" "}
                    {title || <span className="text-slate-500">—</span>}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100">
                      Bajada:
                    </span>{" "}
                    {subtitle || <span className="text-slate-500">—</span>}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100">Pie:</span>{" "}
                    {footer || <span className="text-slate-500">—</span>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnhance}
                disabled={loading || !file}
                className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_35px_rgba(56,189,248,0.45)] transition hover:bg-sky-400 disabled:cursor-default disabled:bg-slate-700 disabled:text-slate-300 disabled:shadow-none"
              >
                {loading
                  ? "Procesando imagen con IA..."
                  : "Mejorar imagen con IA"}
              </button>

              {resultUrl && (
                <div className="space-y-2">
                  <div className="text-[11px] text-emerald-200">
                    Resultado procesado:
                  </div>
                  <img
                    src={resultUrl}
                    alt="Imagen mejorada"
                    className="max-h-64 w-full rounded-lg border border-emerald-500/70 object-cover"
                  />
                </div>
              )}

              {errorMsg && (
                <div className="rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                  {successMsg}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
