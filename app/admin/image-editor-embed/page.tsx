"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";

type EnhanceResponse = {
  enhancedImageUrl: string;
  message?: string;
  overlay?: {
    title?: string | null;
    subtitle?: string | null;
    footer?: string | null;
  };
};

type ImageKind = "raw" | "cover";

type ImageItem = {
  filename: string;
  url: string;
  createdAt?: string;
  kind?: "raw" | "cover" | "other";
};

// Detecta tipo según la URL/path real
function getImageTypeFromUrl(url: string): ImageKind {
  let path = url.toLowerCase();

  try {
    const u = new URL(url);
    path = u.pathname.toLowerCase();
  } catch {
    // ignore
  }

  if (
    path.includes("/covers/") ||
    path.includes("/cover/") ||
    /[-_/]covers?[-_/]/.test(path)
  ) {
    return "cover";
  }

  if (
    path.includes("/raws/") ||
    path.includes("/raw/") ||
    /[-_/]raws?[-_/]/.test(path)
  ) {
    return "raw";
  }

  return "raw";
}

function resolveImageType(img: ImageItem): ImageKind {
  if (img.kind === "raw") return "raw";
  if (img.kind === "cover") return "cover";
  return getImageTypeFromUrl(img.url);
}

const PAGE_SIZE = 10;

// etiquetas disponibles para la portada
const ALERT_TAGS = ["", "URGENTE", "ALERTA", "ÚLTIMA HORA"] as const;
type AlertTag = (typeof ALERT_TAGS)[number];

export default function ImageEditorEmbedPage() {
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [footer, setFooter] = useState("www.canalibertario.com");
  const [alertTag, setAlertTag] = useState<AlertTag>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "raw" | "cover">("all");
  const [page, setPage] = useState(1);

  // para no re-inicializar infinitas veces desde query params
  const [initializedFromQuery, setInitializedFromQuery] = useState(false);

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
      setErrorMsg(
        "Primero seleccioná una imagen base (subí una o elegí un RAW de la biblioteca)."
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const fd = new FormData();
      fd.append("image", file);

      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("news_access_token");
        if (token) {
          fd.append("accessToken", token);
        }
      }

      const safeFooter = footer.trim() || "www.canalibertario.com";

      // Config de marca para que el backend dibuje logo + texto como en el header
      const brandConfig = {
        brandName: "CANALIBERTARIO",
        claim:
          "NOTICIAS Y ANÁLISIS ECONÓMICOS Y POLÍTICOS DESDE UNA MIRADA LIBERTARIA",
        useHeaderWordmark: true,
        siteUrl: safeFooter,
        socialHandle: "@canallibertario",
        socialIcons: ["x", "facebook", "instagram"], // iconos, no texto
      };

      fd.append(
        "optionsJson",
        JSON.stringify({
          title: title.trim() || null,
          subtitle: subtitle.trim() || null,
          footer: safeFooter, // compatibilidad
          brand: brandConfig,
          // NUEVO: etiqueta y bandera para iconos
          alertTag: alertTag || null, // p.ej. "URGENTE"
          useSocialIcons: true,
        })
      );

      const res = await fetch("/api/editor-images/enhance", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text || `Error HTTP ${res.status} al procesar la imagen`
        );
      }

      const data = (await res.json()) as EnhanceResponse;

      if (data.enhancedImageUrl) {
        setResultUrl(data.enhancedImageUrl);
        setSuccessMsg(
          data.message ??
            "Imagen procesada correctamente. Se generó una portada (cover) lista para usar."
        );
        void loadImages();
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

  const loadImages = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const headers: HeadersInit = {
        Accept: "application/json",
      };

      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("news_access_token");
        if (token) {
          headers["authorization"] = `Bearer ${token}`;
        }
      }

      const res = await fetch("/api/editor-images/list", {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text || `Error HTTP ${res.status} al obtener la lista de imágenes`
        );
      }

      const data = (await res.json()) as { items: ImageItem[] };
      setImages(data.items ?? []);
    } catch (err: any) {
      console.error("[image-editor-embed] Error al cargar imágenes:", err);
      setListError(
        err.message ?? "Error al obtener la lista de imágenes del backend."
      );
    } finally {
      setListLoading(false);
    }
  };

  // inicializar desde query params (imageUrl + textos)
  useEffect(() => {
    if (initializedFromQuery) return;

    const imageUrl = searchParams.get("imageUrl");
    const overlayTitle =
      searchParams.get("overlayTitle") ?? searchParams.get("title") ?? "";
    const overlaySubtitle =
      searchParams.get("overlaySubtitle") ?? searchParams.get("subtitle") ?? "";
    const overlayFooter =
      searchParams.get("overlayFooter") ??
      searchParams.get("footer") ??
      "";

    if (overlayTitle) setTitle(overlayTitle);
    if (overlaySubtitle) setSubtitle(overlaySubtitle);
    if (overlayFooter) setFooter(overlayFooter);

    if (imageUrl) {
      (async () => {
        try {
          const res = await fetch(imageUrl);
          if (!res.ok) {
            throw new Error("No se pudo descargar la imagen inicial.");
          }

          const blob = await res.blob();
          const mime = blob.type || "image/jpeg";
          let ext = "jpg";
          if (mime === "image/png") ext = "png";
          else if (mime === "image/webp") ext = "webp";

          const f = new File([blob], `image-from-article.${ext}`, {
            type: mime,
          });

          setFile(f);
          setPreviewUrl(imageUrl);
        } catch (err) {
          console.error(
            "[image-editor-embed] No se pudo inicializar desde imageUrl:",
            err
          );
        } finally {
          setInitializedFromQuery(true);
        }
      })();
    } else {
      setInitializedFromQuery(true);
    }
  }, [initializedFromQuery, searchParams]);

  // usar imagen existente como base
  const selectExistingAsBase = async (img: ImageItem) => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setResultUrl(null);

      const res = await fetch(img.url);
      if (!res.ok) {
        throw new Error("No se pudo descargar la imagen seleccionada.");
      }

      const blob = await res.blob();
      const mime = blob.type || "image/jpeg";
      let ext = "jpg";
      if (mime === "image/png") ext = "png";
      else if (mime === "image/webp") ext = "webp";

      const name = img.filename || `image-from-library.${ext}`;
      const f = new File([blob], name, { type: mime });

      setFile(f);
      setPreviewUrl(img.url);

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      console.error("[image-editor-embed] selectExistingAsBase error:", err);
      setErrorMsg(
        err.message ??
          "No se pudo usar esa imagen como base para la portada."
      );
    }
  };

  useEffect(() => {
    void loadImages();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, images.length]);

  const filteredImages = images.filter((img) => {
    const nameMatch =
      !searchTerm ||
      img.filename.toLowerCase().includes(searchTerm.toLowerCase());

    const imgType = resolveImageType(img);
    const typeMatch =
      typeFilter === "all"
        ? true
        : typeFilter === "raw"
        ? imgType === "raw"
        : imgType === "cover";

    return nameMatch && typeMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredImages.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedImages = filteredImages.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-900/80 bg-slate-950/95 text-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.95)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),transparent_60%)] opacity-80" />

        <section className="relative z-10 space-y-6 p-4 md:p-8">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Editor de imágenes · IA
            </div>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
              Preparar imagen de portada con IA
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Subí una imagen para usarla como portada o elegí una RAW ya
              subida en la biblioteca. Después definí el título, la bajada, la
              etiqueta (URGENTE, etc.) y la firma de CANALIBERTARIO (logo +
              sitio + redes con iconos).
            </p>
          </header>

          <div className="grid gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 md:grid-cols-2 md:p-6">
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                1. Cargar imagen base
              </div>

              <p className="text-xs text-slate-300">
                Elegí una imagen desde tu dispositivo o usá una RAW existente
                de la biblioteca de abajo como base para la portada.
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
                    placeholder="Ej: Nuevo plan económico"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    Etiqueta (opcional)
                  </label>
                  <select
                    value={alertTag}
                    onChange={(e) => setAlertTag(e.target.value as AlertTag)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                  >
                    <option value="">Sin etiqueta</option>
                    <option value="URGENTE">URGENTE</option>
                    <option value="ALERTA">ALERTA</option>
                    <option value="ÚLTIMA HORA">ÚLTIMA HORA</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    Sitio del canal (se mostrará junto a iconos de X / Facebook
                    / Instagram)
                  </label>
                  <input
                    type="text"
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    placeholder="www.canalibertario.com"
                  />
                </div>
              </div>
            </div>

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
                    Todavía no cargaste ninguna imagen. Subí una o elegí una
                    RAW desde la biblioteca para ver cómo se vería como
                    portada.
                  </p>
                )}
              </div>

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
                    <span className="font-semibold text-slate-100">
                      Etiqueta:
                    </span>{" "}
                    {alertTag || <span className="text-slate-500">(sin)</span>}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100">
                      Firma CANALIBERTARIO:
                    </span>{" "}
                    {(footer || "www.canalibertario.com") +
                      " + iconos de X / Facebook / Instagram"}
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

      <section className="mt-6 rounded-3xl border border-slate-900/80 bg-slate-950/95 p-4 text-slate-50">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Biblioteca de imágenes</h2>
            <p className="text-xs text-slate-400">
              Acá ves todas las imágenes que subiste desde el editor. Podés
              usarlas como base (RAW) para nuevas portadas, copiar la URL o
              abrirlas en otra pestaña.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-40 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
            />

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | "raw" | "cover")
              }
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 outline-none focus:border-sky-400"
            >
              <option value="all">Todas</option>
              <option value="raw">RAW</option>
              <option value="cover">Covers</option>
            </select>

            <button
              type="button"
              onClick={() => void loadImages()}
              disabled={listLoading}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:border-sky-400 hover:bg-slate-800 disabled:cursor-default disabled:opacity-60"
            >
              {listLoading ? "Actualizando..." : "Refrescar lista"}
            </button>
          </div>
        </div>

        {listError && (
          <div className="mt-2 rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
            {JSON.stringify(listError)}
          </div>
        )}

        {!listError && !listLoading && images.length === 0 && (
          <p className="mt-2 text-[11px] text-slate-400">
            Todavía no hay imágenes guardadas o no se pudo obtener la lista.
          </p>
        )}

        {!listError &&
          !listLoading &&
          images.length > 0 &&
          filteredImages.length === 0 && (
            <p className="mt-2 text-[11px] text-slate-400">
              No se encontraron imágenes con esos filtros.
            </p>
          )}

        {!listError && filteredImages.length > 0 && (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {pagedImages.map((img, index) => {
                const imgType = resolveImageType(img);
                return (
                  <div
                    key={img.url || `${img.filename}-${index}`}
                    className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-[11px]"
                  >
                    <div className="mb-2 aspect-video overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                      <img
                        src={img.url}
                        alt={img.filename}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-slate-100">
                        {img.filename}
                      </span>
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                          imgType === "raw"
                            ? "border border-amber-400/70 bg-amber-500/10 text-amber-200"
                            : "border border-sky-400/70 bg-sky-500/10 text-sky-200"
                        }`}
                      >
                        {imgType === "raw" ? "RAW" : "COVER"}
                      </span>
                    </div>

                    <div className="mb-2 truncate text-[10px] text-slate-400">
                      {img.url}
                    </div>

                    <div className="mt-auto flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => void selectExistingAsBase(img)}
                        className="w-full rounded-full border border-sky-400/80 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-200 hover:bg-sky-500/20"
                      >
                        Usar como base
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(img.url, "_blank")}
                          className="flex-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold hover:border-sky-400 hover:bg-slate-800"
                        >
                          Abrir
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(img.url);
                              alert("URL copiada al portapapeles");
                            } catch {
                              alert("No se pudo copiar la URL");
                            }
                          }}
                          className="flex-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold hover:border-sky-400 hover:bg-slate-800"
                        >
                          Copiar URL
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col items-center justify-between gap-2 text-[11px] text-slate-300 sm:flex-row">
              <div>
                Mostrando{" "}
                <span className="font-semibold">
                  {startIndex + 1}-{startIndex + pagedImages.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold">
                  {filteredImages.length}
                </span>{" "}
                imágenes
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:border-sky-400 hover:bg-slate-800 disabled:cursor-default disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="min-w-[90px] text-center">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:border-sky-400 hover:bg-slate-800 disabled:cursor-default disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
