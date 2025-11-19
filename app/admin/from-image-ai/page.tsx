// app/admin/from-image-ai/page.tsx
"use client";

import { FormEvent, useState, ClipboardEvent } from "react";

type FormState = {
  title: string;
  summary: string;
  bodyHtml: string;
  category: string;
  ideology: string;
  publishedAt: string;
  imageUrl?: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400/60";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400";

// helper para armar headers con el JWT guardado en localStorage
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("news_access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default function EditorFromImagePage() {
  const [form, setForm] = useState<FormState>({
    title: "",
    summary: "",
    bodyHtml: "",
    category: "Noticias",
    ideology: "",
    publishedAt: new Date().toISOString().slice(0, 19) + "Z",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleScreenshotFile = (file: File) => {
    setImageFile(file);
    setErrorMsg(null);
    setSuccessMsg(
      'Imagen lista para procesar. Ahora hacé clic en "Procesar captura con IA".'
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      handleScreenshotFile(file);
    }
  };

  const handlePasteImage = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleScreenshotFile(file);
          e.preventDefault();
        }
        break;
      }
    }
  };

  const setDelay = (minutes: number) => {
    setForm((prev) => {
      const d = new Date();
      d.setMinutes(d.getMinutes() + minutes);
      const iso = d.toISOString();
      return { ...prev, publishedAt: iso };
    });
  };

  const handleProcessImage = async () => {
    if (!imageFile) {
      setErrorMsg("Subí o pegá una imagen antes de procesarla.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setImageLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("formJson", JSON.stringify(form));

      // ⬇️ nuevo endpoint del front
      const res = await fetch("/api/editor-articles/from-image-ai", {
        method: "POST",
        body: fd,
        headers: {
          ...getAuthHeaders(), // mandamos Authorization al route del front
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error HTTP ${res.status}`);
      }

      const suggested = await res.json();

      setForm((prev) => {
        const next: FormState = {
          ...prev,
          ...suggested,
          // si el usuario ya eligió ideología a mano, se respeta
          ideology: prev.ideology,
        };

        const imgUrl: string | undefined =
          suggested.imageUrl ?? next.imageUrl ?? undefined;

        let finalBody: string = next.bodyHtml ?? prev.bodyHtml;

        if (imgUrl) {
          const imgTag = `<p><img src="${imgUrl}" alt="${
            next.title || "Imagen de la captura"
          }" /></p>`;

          if (!finalBody || !finalBody.includes(imgTag)) {
            finalBody = imgTag + "\n\n" + (finalBody || "");
          }
        }

        next.bodyHtml = finalBody;
        return next;
      });

      setSuccessMsg("Campos rellenados a partir de la captura con IA.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Error al procesar la captura con la IA.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        ...form,
        ideology:
          form.ideology && form.ideology.trim().length > 0
            ? form.ideology
            : null,
      };

      // ⬇️ nuevo endpoint del front
      const res = await fetch("/api/editor-articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(), // también acá mandamos Authorization
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error HTTP ${res.status}`);
      }

      const article = await res.json();

      setSuccessMsg(
        `Nota creada correctamente: "${article.title}" (slug: ${article.slug})`
      );

      setForm((prev) => ({
        ...prev,
        title: "",
        summary: "",
        bodyHtml: "",
        imageUrl: "",
        // ideology: "", // descomentá si querés limpiar también esto
      }));
      setImageFile(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Error inesperado al crear la nota");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/80 text-slate-50 shadow-[0_40px_90px_rgba(0,0,0,0.75)]">
        <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.26),transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.22),transparent_60%)]" />

        <div className="relative z-10 p-6 md:p-8 lg:p-10 space-y-8">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/50 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-200">
              Cargar desde imagen · IA
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
              Cargar artículo desde imagen (IA)
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Subí una captura de una publicación (Twitter, Facebook, portal de
              noticias, etc.) o una imagen de portada. La IA sugiere título,
              resumen, cuerpo e inserta la imagen en la nota. Después podés
              ajustar todo antes de publicar.
            </p>
          </header>

          {/* Bloque captura */}
          <section className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/70 p-4 md:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Procesar captura de pantalla
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                Subí una captura de una publicación oficial. Al hacer clic en{" "}
                <strong>“Procesar captura con IA”</strong>, se sube la imagen al
                backend, se genera texto sugerido y se inserta la imagen en el
                cuerpo de la nota.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-50 hover:border-purple-300/70 hover:bg-slate-800">
                Seleccionar imagen desde el dispositivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleProcessImage}
                disabled={imageLoading || !imageFile}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold shadow-[0_18px_35px_rgba(139,92,246,0.45)] transition disabled:shadow-none disabled:bg-slate-600 disabled:cursor-default bg-purple-500 text-slate-950 hover:bg-purple-400"
              >
                {imageLoading
                  ? "Procesando captura..."
                  : "Procesar captura con IA"}
              </button>
            </div>

            <div
              onPaste={handlePasteImage}
              tabIndex={0}
              onClick={(e) => (e.currentTarget as HTMLDivElement).focus()}
              className="mt-2 rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/80 p-4 text-center text-xs text-slate-300 outline-none"
            >
              <p className="mb-1">
                O hacé clic acá y luego presioná <code>Ctrl+V</code> para pegar
                una captura desde el portapapeles.
              </p>
              <p className="text-[11px] text-slate-400">
                Usá la herramienta de recorte (por ejemplo{" "}
                <strong>Win+Shift+S</strong> en Windows) para copiar una imagen
                y después pegala en este cuadro.
              </p>
            </div>

            {form.imageUrl && (
              <div className="pt-2">
                <p className="mb-2 text-xs text-slate-200">
                  Vista previa de la imagen subida:
                </p>
                <img
                  src={form.imageUrl}
                  alt="Preview captura"
                  className="max-h-72 w-full rounded-xl border border-slate-700 object-cover"
                />
              </div>
            )}
          </section>

          {/* Formulario principal */}
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 md:p-6 shadow-[0_22px_55px_rgba(0,0,0,0.65)]"
          >
            {/* Título */}
            <div>
              <label htmlFor="title" className={labelClass}>
                Título *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={form.title}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Resumen */}
            <div>
              <label htmlFor="summary" className={labelClass}>
                Resumen *
              </label>
              <textarea
                id="summary"
                name="summary"
                required
                rows={3}
                value={form.summary}
                onChange={handleChange}
                className={`${inputClass} resize-y`}
              />
            </div>

            {/* Cuerpo HTML */}
            <div>
              <label htmlFor="bodyHtml" className={labelClass}>
                Cuerpo (HTML limpio) *
              </label>
              <textarea
                id="bodyHtml"
                name="bodyHtml"
                required
                rows={6}
                value={form.bodyHtml}
                onChange={handleChange}
                className={`${inputClass} resize-y font-mono text-[13px]`}
              />
              <small className="mt-1 block text-[11px] text-slate-400">
                Ejemplo:{" "}
                {"<p>Texto principal procesado por IA desde una captura.</p>"}
              </small>
            </div>

            {/* Categoría + Ideología */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="category" className={labelClass}>
                  Categoría *
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="Noticias">Noticias</option>
                  <option value="economia">Economía</option>
                  <option value="politica">Política</option>
                  <option value="internacional">Internacional</option>
                </select>
              </div>

              <div>
                <label htmlFor="ideology" className={labelClass}>
                  Línea editorial / etiqueta
                </label>
                <select
                  id="ideology"
                  name="ideology"
                  value={form.ideology}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Sin etiqueta</option>
                  <option value="oficialismo">oficialismo</option>
                  <option value="oposicion">oposicion</option>
                  <option value="neutral">neutral</option>
                  <option value="RIGHT">RIGHT</option>
                  <option value="LEFT">LEFT</option>
                </select>
              </div>
            </div>

            {/* Fecha publicada */}
            <div>
              <label htmlFor="publishedAt" className={labelClass}>
                Fecha/hora publicada (ISO) *
              </label>
              <input
                id="publishedAt"
                name="publishedAt"
                type="text"
                required
                value={form.publishedAt}
                onChange={handleChange}
                className={`${inputClass} font-mono text-[13px]`}
              />
              <small className="mt-1 block text-[11px] text-slate-400">
                Formato: 2025-11-15T12:00:00Z (después lo cambiamos por un
                datepicker).
              </small>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                <span>Atajos rápidos:</span>
                <button
                  type="button"
                  onClick={() => setDelay(0)}
                  className="rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 hover:border-purple-300/70"
                >
                  Ahora
                </button>
                <button
                  type="button"
                  onClick={() => setDelay(15)}
                  className="rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 hover:border-purple-300/70"
                >
                  +15 min
                </button>
                <button
                  type="button"
                  onClick={() => setDelay(60)}
                  className="rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 hover:border-purple-300/70"
                >
                  +1 hora
                </button>
              </div>
            </div>

            {/* Mensajes */}
            {errorMsg && (
              <div className="rounded-xl border border-red-400/50 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-100">
                {successMsg}
              </div>
            )}

            {/* Botón guardar */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex items-center justify-center rounded-full bg-purple-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_35px_rgba(139,92,246,0.5)] transition hover:bg-purple-400 disabled:cursor-default disabled:bg-slate-600 disabled:shadow-none"
            >
              {loading ? "Guardando..." : "Crear artículo"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
