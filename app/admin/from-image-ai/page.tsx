// app/admin/from-image-ai/page.tsx
"use client";

import {
  FormEvent,
  useState,
  ClipboardEvent,
  ChangeEvent,
  useEffect,
} from "react";

import { publishArticleToFacebook } from "../../lib/facebook";
import {
  publishArticleToInstagram,
  buildInstagramCaption,
} from "../../lib/instagram";
import { stripHtml } from "../../lib/text";

type FormState = {
  title: string;
  summary: string;
  bodyHtml: string;
  category: string;
  ideology: string;
  publishedAt: string;
  imageUrl?: string;
  status: string; // draft | published
};

type EditorSyncData = {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  footer?: string;
};

type EnhanceResponse = {
  enhancedImageUrl: string;
  message?: string;
  overlay?: {
    title?: string | null;
    subtitle?: string | null;
    footer?: string | null;
  };
};

const inputClass =
  "w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400/60";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("news_access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// 🔹 Formatear publishedAt para usarlo como footer/fecha en la portada
function formatPublishedAtForFooter(
  iso: string | undefined | null,
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const datePart = d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${datePart} · ${timePart}`;
  } catch {
    return iso;
  }
}

const DEFAULT_SITE_FOOTER = "";

export default function EditorFromImagePage() {
  const [form, setForm] = useState<FormState>({
    title: "",
    summary: "",
    bodyHtml: "",
    category: "Noticias",
    ideology: "",
    publishedAt: new Date().toISOString().slice(0, 19) + "Z",
    imageUrl: "",
    status: "draft",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // 🔹 solo para la vista previa local de la captura
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<
    string | null
  >(null);

  const [showEditor, setShowEditor] = useState(true);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showFullEditorModal, setShowFullEditorModal] = useState(false);

  // datos que le mandamos al editor de portadas
  const [editorSyncData, setEditorSyncData] = useState<EditorSyncData>({});
  const [editorReloadTick, setEditorReloadTick] = useState(0);

  // 🔹 flag para publicar en Facebook al crear
  const [publishToFacebook, setPublishToFacebook] = useState(true);
  const [fbErrorMsg, setFbErrorMsg] = useState<string | null>(null);

  // 🔹 flag para publicar en Instagram al crear
  const [publishToInstagram, setPublishToInstagram] = useState(true);
  const [igErrorMsg, setIgErrorMsg] = useState<string | null>(null);

  // limpiar URL de objeto cuando cambie la captura
  useEffect(() => {
    return () => {
      if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl);
      }
    };
  }, [screenshotPreviewUrl]);

  // 🔹 Escuchar mensajes del iframe (URL copiada)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "editor-image-url" && typeof data.url === "string") {
        setForm((prev) => ({
          ...prev,
          imageUrl: data.url,
        }));
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // 🔹 Cuando cambia la fecha publicada, actualizar footer del editor
  useEffect(() => {
    const footerFromDate = formatPublishedAtForFooter(form.publishedAt);
    if (!footerFromDate) return;

    setEditorSyncData((prev) => ({
      ...prev,
      footer: footerFromDate,
    }));
    setEditorReloadTick((t) => t + 1);
  }, [form.publishedAt]);

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScreenshotFile = (file: File) => {
    if (screenshotPreviewUrl) {
      URL.revokeObjectURL(screenshotPreviewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setScreenshotPreviewUrl(objectUrl);

    setImageFile(file);
    setErrorMsg(null);
    setSuccessMsg(
      'Imagen lista para procesar. Ahora hacé clic en "Procesar captura con IA".',
    );
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      return {
        ...prev,
        publishedAt: iso,
      };
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
      // 1) Generar nota desde la captura (SOLO TEXTO + URL de la captura en el backend)
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("formJson", JSON.stringify(form));

      const res = await fetch("/api/editor-articles/from-image-ai", {
        method: "POST",
        body: fd,
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error HTTP ${res.status}`);
      }

      const suggested = await res.json();

      const autoTitle: string | undefined =
        suggested.title || form.title || undefined;

      const autoSummary: string | undefined =
        suggested.summary || form.summary || undefined;

      // 2) Actualizar el formulario con lo generado
      //    ⚠️ Importante: NO pisamos imageUrl con lo que venga del backend
      setForm((prev) => {
        const next: FormState = {
          ...prev,
          ...suggested,
          ideology: prev.ideology,
          status: prev.status,
          imageUrl: prev.imageUrl, // mantenemos la portada que haya puesto el usuario (o vacío)
        };
        return next;
      });

      // 3) Sincronizar con el editor de la derecha.
      const defaultFooterFromDate =
        formatPublishedAtForFooter(form.publishedAt) || DEFAULT_SITE_FOOTER;

      const editorImageForSync = screenshotPreviewUrl || undefined;
      const syncTitle = autoTitle;
      const syncSubtitle = autoSummary;
      const syncFooter = defaultFooterFromDate;

      setEditorSyncData({
        title: syncTitle,
        subtitle: syncSubtitle,
        imageUrl: editorImageForSync,
        footer: syncFooter,
      });
      setEditorReloadTick((t) => t + 1);

      setSuccessMsg(
        "Campos rellenados a partir de la captura con IA. Ahora podés generar y ajustar la portada desde el editor de la derecha.",
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "Error al procesar la captura con la IA.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFbErrorMsg(null);
    setIgErrorMsg(null);

    try {
      const payload = {
        ...form,
        ideology:
          form.ideology && form.ideology.trim().length > 0 ? form.ideology : null,
      };

      const res = await fetch("/api/editor-articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error HTTP ${res.status}`);
      }

      const article = await res.json();

      let okMsg = `Nota creada correctamente: "${article.title}" (slug: ${article.slug})`;

      // 🔹 Si está en "published" y el toggle está activo → publicamos en Facebook
      if (publishToFacebook && payload.status === "published") {
        try {
          const fbText = stripHtml(form.bodyHtml, 4500);
          const fbRes = await publishArticleToFacebook(article.id, {
            customTitle: form.title,
            customSummary: fbText,
            imageUrlOverride: form.imageUrl ?? undefined,
          });

          okMsg += ` · Enviada a Facebook (simulado), estado=${fbRes.status}`;
        } catch (err: any) {
          console.error("Error al publicar en Facebook", err);
          setFbErrorMsg(
            err?.message ||
              "La nota se creó, pero falló la publicación en Facebook.",
          );
        }
      }

      // 🔹 Si está en "published" y el toggle de IG está activo → publicamos en Instagram
      if (publishToInstagram && payload.status === "published") {
        try {
          // Usamos la URL del form si existe, si no, usamos la que devolvió el backend
          const imageUrlForIg =
            (form.imageUrl && form.imageUrl.trim()) ||
            (article.coverImageUrl && String(article.coverImageUrl).trim()) ||
            "";

          if (!imageUrlForIg) {
            setIgErrorMsg(
              "La nota se creó, pero no se pudo publicar en Instagram porque no hay URL de portada.",
            );
          } else {
            const caption = buildInstagramCaption(form.title, form.bodyHtml, 2200);

            const igRes = await publishArticleToInstagram(article.id, {
              caption,
              imageUrl: imageUrlForIg,
            });

            okMsg += ` · Enviada a Instagram, estado=${igRes.status}`;
          }
        } catch (err: any) {
          console.error("Error al publicar en Instagram", err);
          setIgErrorMsg(
            err?.message ||
              "La nota se creó, pero falló la publicación en Instagram.",
          );
        }
      }

      setSuccessMsg(okMsg);

      setForm((prev) => ({
        ...prev,
        title: "",
        summary: "",
        bodyHtml: "",
        imageUrl: "",
      }));
      setImageFile(null);
      if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl);
        setScreenshotPreviewUrl(null);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "Error inesperado al crear la nota");
    } finally {
      setLoading(false);
    }
  };

  const handlePasteUrlFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      setForm((prev) => ({
        ...prev,
        imageUrl: text.trim(),
      }));
    } catch {
      alert("No se pudo leer el portapapeles");
    }
  };

  // Quitar la primera imagen del cuerpo (la captura original)
  const handleRemoveOriginalImageFromBody = () => {
    if (!form.bodyHtml) return;

    let cleaned = form.bodyHtml.replace(/<p[^>]*>\s*<img[^>]*>\s*<\/p>/i, "");
    cleaned = cleaned.replace(/<img[^>]*>\s*/i, "");

    setForm((prev) => ({
      ...prev,
      bodyHtml: cleaned,
    }));
  };

  // =========================
  // URL del iframe del editor
  // =========================
  const editorParams = new URLSearchParams();
  editorParams.set("tick", String(editorReloadTick));
  if (editorSyncData.title) editorParams.set("title", editorSyncData.title);
  if (editorSyncData.subtitle)
    editorParams.set("subtitle", editorSyncData.subtitle);
  if (editorSyncData.imageUrl)
    editorParams.set("imageUrl", editorSyncData.imageUrl);
  if (editorSyncData.footer) editorParams.set("footer", editorSyncData.footer);

  const editorIframeSrc = `/admin/image-editor-embed?${editorParams.toString()}`;
  const editorPageUrl = `/admin/image-editor?${editorParams.toString()}`;
  const fullEditorPageUrl = `/admin/image-editor/full?${editorParams.toString()}`;

  return (
    <main className="mx-auto w-full py-10">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-zinc-950/95 text-zinc-50 shadow-[0_40px_90px_rgba(0,0,0,0.8)]">
        {/* 🔹 Columna derecha (editor) más grande */}
        <div className="relative z-10 grid gap-8 p-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] md:p-8 lg:p-10">
          {/* Columna izquierda: captura + formulario */}
          <div className="space-y-6">
            <header className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/50 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-200">
                Cargar desde imagen · IA
              </div>
              <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
                Cargar artículo desde imagen (IA)
              </h1>
              <p className="max-w-2xl text-sm text-zinc-300">
                Subí una captura de una publicación (Twitter, Facebook, portal
                de medios, etc.) o una imagen de portada. La IA sugiere título,
                resumen, cuerpo e inserta la imagen en la nota. Después podés
                ajustar todo antes de publicar y, si querés, generar una portada
                desde el editor de la derecha.
              </p>
            </header>

            {/* Bloque captura */}
            <section className="space-y-4 rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-900/80 p-4 md:p-5">
              <div>
                <h2 className="text-sm font-semibold text-zinc-50">
                  Procesar captura de pantalla
                </h2>
                <p className="mt-1 text-xs text-zinc-300">
                  Subí una captura de una publicación oficial. Al hacer clic en{" "}
                  <strong>“Procesar captura con IA”</strong>, se sube la imagen
                  al backend, se genera texto sugerido y se inserta la imagen en
                  el cuerpo de la nota (sin modificarla). La portada la generás
                  aparte desde el editor de la derecha.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-50 hover:border-purple-300/70 hover:bg-zinc-800">
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
                  className="inline-flex items-center justify-center rounded-full bg-purple-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_35px_rgba(139,92,246,0.45)] transition hover:bg-purple-400 disabled:cursor-default disabled:bg-zinc-600 disabled:shadow-none"
                >
                  {imageLoading ? "Procesando captura..." : "Procesar captura con IA"}
                </button>
              </div>

              <div
                onPaste={handlePasteImage}
                tabIndex={0}
                onClick={(e) => (e.currentTarget as HTMLDivElement).focus()}
                className="mt-2 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-900/80 p-4 text-center text-xs text-zinc-300 outline-none"
              >
                <p className="mb-1">
                  O hacé clic acá y luego presioná <code>Ctrl+V</code> para
                  pegar una captura desde el portapapeles.
                </p>
                <p className="text-[11px] text-zinc-400">
                  Usá la herramienta de recorte (por ejemplo{" "}
                  <strong>Win+Shift+S</strong> en Windows) para copiar una
                  imagen y después pegala en este cuadro.
                </p>
              </div>

              {(screenshotPreviewUrl || form.imageUrl) && (
                <div className="pt-2">
                  <p className="mb-2 text-xs text-zinc-200">
                    Vista previa de la imagen subida:
                  </p>
                  <img
                    src={screenshotPreviewUrl || (form.imageUrl as string)}
                    alt="Preview captura"
                    className="max-h-72 w-full rounded-xl border border-zinc-700 object-cover"
                  />
                </div>
              )}
            </section>

            {/* Formulario principal */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border border-zinc-700/80 bg-zinc-900/80 p-4 md:p-6 shadow-[0_22px_55px_rgba(0,0,0,0.65)]"
            >
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

              <div>
                <label htmlFor="imageUrl" className={labelClass}>
                  URL imagen principal / portada
                </label>
                <div className="flex gap-2">
                  <input
                    id="imageUrl"
                    name="imageUrl"
                    type="text"
                    value={form.imageUrl ?? ""}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://.../uploads/portada.jpg"
                  />
                  <button
                    type="button"
                    onClick={handlePasteUrlFromClipboard}
                    className="whitespace-nowrap rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-50 hover:border-purple-300/70"
                  >
                    Usar URL del portapapeles
                  </button>
                </div>
                <small className="mt-1 block text-[11px] text-zinc-400">
                  Copiá la URL de la portada generada en el editor de imágenes
                  y pegala acá (o usá el botón si ya está en el portapapeles).
                  Si la copiás desde el editor, se completa automáticamente.
                </small>
              </div>

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
                <div className="mt-1 flex flex-col gap-2 text-[11px] text-zinc-400 md:flex-row md:items-center md:justify-between">
                  <span>
                    Ejemplo:{" "}
                    {"<p>Texto principal procesado por IA desde una captura.</p>"}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveOriginalImageFromBody}
                    className="self-start rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-semibold text-zinc-100 hover:border-red-400 hover:bg-red-500/10 hover:text-red-200 md:self-auto"
                  >
                    Quitar imagen original
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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

                <div>
                  <label htmlFor="status" className={labelClass}>
                    Estado
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                  <small className="mt-1 block text-[11px] text-zinc-400">
                    Por defecto se guarda como borrador.
                  </small>
                </div>
              </div>

              {/* Publicación en redes */}
              <div className="space-y-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Publicación en redes
                </p>

                {/* Facebook */}
                <div>
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-200">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-zinc-500 bg-zinc-900 text-fuchsia-500 focus:ring-fuchsia-500"
                      checked={publishToFacebook}
                      onChange={(e) => setPublishToFacebook(e.target.checked)}
                    />
                    <span>
                      Publicar en Facebook al crear{" "}
                      <span className="text-[10px] text-zinc-400">
                        (si el estado es <code>published</code>)
                      </span>
                    </span>
                  </label>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Se enviará el título y el cuerpo (en texto plano) como
                    contenido del post. La publicación se hace en la página de
                    Facebook configurada en el backend.
                  </p>
                </div>

                {/* Instagram */}
                <div className="border-t border-zinc-800 pt-3">
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-200">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-zinc-500 bg-zinc-900 text-pink-500 focus:ring-pink-500"
                      checked={publishToInstagram}
                      onChange={(e) => setPublishToInstagram(e.target.checked)}
                    />
                    <span>
                      Publicar en Instagram al crear{" "}
                      <span className="text-[10px] text-zinc-400">
                        (usa la URL de portada y el cuerpo limpio)
                      </span>
                    </span>
                  </label>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Se usará la portada indicada arriba como imagen del post y
                    se enviará un caption con el título y un resumen del texto.
                  </p>
                </div>
              </div>

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
                <small className="mt-1 block text-[11px] text-zinc-400">
                  Formato: 2025-11-15T12:00:00Z (después lo cambiamos por un
                  datepicker). Esta fecha también se muestra en el footer de la
                  portada.
                </small>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
                  <span>Atajos rápidos:</span>
                  <button
                    type="button"
                    onClick={() => setDelay(0)}
                    className="rounded-full border border-zinc-600 bg-zinc-800/80 px-3 py-1 hover:border-purple-300/70"
                  >
                    Ahora
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelay(15)}
                    className="rounded-full border border-zinc-600 bg-zinc-800/80 px-3 py-1 hover:border-purple-300/70"
                  >
                    +15 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelay(60)}
                    className="rounded-full border border-zinc-600 bg-zinc-800/80 px-3 py-1 hover:border-purple-300/70"
                  >
                    +1 hora
                  </button>
                </div>
              </div>

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

              {fbErrorMsg && (
                <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100">
                  {fbErrorMsg}
                </div>
              )}

              {igErrorMsg && (
                <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100">
                  {igErrorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex items-center justify-center rounded-full bg-purple-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_35px_rgba(139,92,246,0.5)] transition hover:bg-purple-400 disabled:cursor-default disabled:bg-zinc-600 disabled:shadow-none"
              >
                {loading ? "Guardando..." : "Crear artículo"}
              </button>
            </form>
          </div>

          {/* Columna derecha: editor de portadas embebido (más grande) */}
          <aside className="space-y-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-4 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-zinc-50">
                  Editor de portadas (IA)
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Usá este editor de imágenes para generar portadas (covers) a
                  partir de la captura o cualquier otra foto.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditor((v) => !v)}
                  className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-100 hover:border-purple-300/70"
                >
                  {showEditor ? "Ocultar editor" : "Mostrar editor"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditorModal(true)}
                  className="rounded-full border border-purple-400/70 bg-purple-500/15 px-3 py-1 text-[11px] font-semibold text-purple-100 hover:bg-purple-500/25"
                >
                  Ver en modal, Edicion básica y selección de imagenes.
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullEditorModal(true)}
                  className="rounded-full border border-sky-400/70 bg-sky-500/15 px-3 py-1 text-[11px] font-semibold text-sky-100 hover:bg-sky-500/25"
                >
                  Ver en modal, Editor completo de imagen.
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400">
              1. Procesá la captura y generá la nota con IA. <br />
              2. El editor se carga con la misma imagen base (cruda) y los
              textos sugeridos. <br />
              3. Desde ahí podés ajustar todo y generar la portada; al copiar la
              URL desde el editor se pega sola en el campo de portada.
            </p>

            <div className="mt-3 rounded-2xl bg-zinc-950/90 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Vista del editor</span>
                <a
                  href={editorPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-purple-300 hover:text-purple-200"
                >
                  Abrir en pestaña nueva
                </a>
              </div>

              {showEditor ? (
                <div className="relative overflow-hidden rounded-[28px] border border-zinc-700 bg-black/80">
                  <div className="mx-auto w-full max-w-[640px]">
                    <div className="aspect-[9/16] overflow-hidden bg-black">
                      <iframe
                        key={editorReloadTick}
                        src={editorIframeSrc}
                        className="h-full w-full border-0"
                        title="Editor de portadas"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/80 p-3 text-[11px] text-zinc-300">
                  El editor está oculto. Hacé clic en{" "}
                  <strong>“Mostrar editor”</strong> para verlo embebido acá.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* 🔹 Modal flotante con el editor en grande */}
      {showEditorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-5xl rounded-3xl border border-zinc-700 bg-zinc-950 p-4 md:p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-zinc-50">
                  Editor de portadas · vista grande
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Ajustá la portada en grande. Cuando copies la URL desde el
                  editor, se completa sola en el campo de portada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-100 hover:border-red-400/80 hover:text-red-200"
              >
                Cerrar
              </button>
            </div>

            <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-700 bg-black">
              <iframe
                key={editorReloadTick + 1000}
                src={editorIframeSrc}
                className="h-full w-full border-0"
                title="Editor de portadas grande"
              />
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modal flotante con el editor FULL (pantalla completa 16:9) */}
      {showFullEditorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-6xl rounded-3xl border border-zinc-700 bg-zinc-950 p-4 md:p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-zinc-50">
                  Editor de portadas · pantalla completa
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Esta vista usa el editor full 16:9. Los cambios de portada se
                  siguen enviando a este formulario cuando copiás la URL.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullEditorModal(false)}
                className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-100 hover:border-red-400/80 hover:text-red-200"
              >
                Cerrar
              </button>
            </div>

            <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-700 bg-black">
              <iframe
                key={editorReloadTick + 2000}
                src={fullEditorPageUrl}
                className="h-full w-full border-0"
                title="Editor de portadas full"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
