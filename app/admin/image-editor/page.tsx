// app/admin/image-editor/page.tsx
"use client";

import { useEffect, useMemo, useState, ChangeEvent, ClipboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { getBrandUrl } from "@/app/lib/api";

type EnhanceResponse = {
  enhancedImageUrl: string;
  message?: string;
};

type ImageKind = "raw" | "cover";

type ImageItem = {
  filename: string;
  url: string;
  createdAt?: string;
  kind?: "raw" | "cover" | "other";
};

type CoverTheme = "purple" | "sunset" | "black";

const ALERT_TAGS = ["", "URGENTE", "ALERTA", "ÚLTIMA HORA"] as const;
type AlertTag = (typeof ALERT_TAGS)[number];

const PAGE_SIZE = 10;

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

function toISODateOnly(input?: string | null): string {
  try {
    if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const d = input ? new Date(input) : new Date();
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function formatDateARFromISO(iso: string): string {
  try {
    const parts = iso.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return new Date().toLocaleDateString("es-AR");
  } catch {
    return new Date().toLocaleDateString("es-AR");
  }
}

function themeLabel(value: CoverTheme): string {
  switch (value) {
    case "purple":
      return "Violeta";
    case "sunset":
      return "Naranja";
    case "black":
      return "Negro";
    default:
      return value;
  }
}

function getPillBg(alertTag: string): string {
  if (!alertTag) return "rgba(255,255,255,0.14)";
  if (alertTag === "ÚLTIMA HORA") return "rgba(220,38,38,0.95)";
  return "rgba(55,65,81,0.92)";
}

/**
 * Overlay inferior fijo (simple, sale bien casi siempre)
 */
function getBottomOverlay(theme: CoverTheme): string {
  const a = 0.9;

  switch (theme) {
    case "sunset":
      return `linear-gradient(to bottom,
        rgba(0,0,0,0) 0%,
        rgba(0,0,0,${0.30 * a}) 40%,
        rgba(0,0,0,${0.78 * a}) 100%)`;
    case "purple":
      return `linear-gradient(to bottom,
        rgba(0,0,0,0) 0%,
        rgba(2,6,23,${0.34 * a}) 40%,
        rgba(2,6,23,${0.82 * a}) 100%)`;
    case "black":
    default:
      return `linear-gradient(to bottom,
        rgba(0,0,0,0) 0%,
        rgba(0,0,0,${0.32 * a}) 40%,
        rgba(0,0,0,${0.82 * a}) 100%)`;
  }
}

export default function ImageEditorEmbedPage() {
  const searchParams = useSearchParams();

  // Assets
  const BRAND_LOGO_HORIZONTAL = getBrandUrl("/brand/logo-horizontal.png");
  const BRAND_LOCKUP = getBrandUrl("/brand/canalibertario.png");

  // Base image
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Minimal inputs
  const [title, setTitle] = useState("");
  const [useSubtitle, setUseSubtitle] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [alertTag, setAlertTag] = useState<AlertTag>("");
  const [theme, setTheme] = useState<CoverTheme>("black");

  // Publish date
  const [publishDateIso, setPublishDateIso] = useState<string>(() =>
    toISODateOnly(null),
  );
  const publishDateAR = formatDateARFromISO(publishDateIso);

  // UX
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Screenshot input
  const [screenshotInput, setScreenshotInput] = useState("");

  // Advanced
  const [showSafeArea, setShowSafeArea] = useState(false);

  // Library
  const [images, setImages] = useState<ImageItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "raw" | "cover">("all");
  const [page, setPage] = useState(1);

  const DEFAULT_LOOK = useMemo(
    () => ({
      overlayHeightPct: 30,
      titleFontPx: 42,
      subtitleFontPx: 16,
      pillFontPx: 12,
      footerFontPx: 12,

      titleColor: "#ffffff",
      subtitleColor: "#e5e7eb",
      dateColor: "#ffffff",

      line2Opacity: 0.86,
      line2Weight: 750,
      footerOpacity: 0.92,

      textPosition: "bottom" as const,
      textOffsetPct: 0,
      alertAlign: "left" as const,
      coverVariant: "classic" as const,

      useBrandLockup: true,

      SAFE_X: "5%",
      SAFE_TOP: "6.5%",
      SAFE_BOTTOM: "10%",
    }),
    [],
  );

  const applyBaseFile = (f: File, previewSrc: string) => {
    setFile(f);
    setResultUrl(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewUrl(previewSrc);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const objectUrl = URL.createObjectURL(f);
    applyBaseFile(f, objectUrl);
  };

  // paste screenshot (image or url)
  const handleScreenshotPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            e.preventDefault();
            const objectUrl = URL.createObjectURL(pastedFile);
            applyBaseFile(pastedFile, objectUrl);
            setScreenshotInput("");
            return;
          }
        }
      }
    }

    const text = e.clipboardData.getData("text");
    if (text) {
      e.preventDefault();
      setScreenshotInput(text);
    }
  };

  const handleLoadScreenshotUrl = async () => {
    const url = screenshotInput.trim();
    if (!url) return;

    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setResultUrl(null);

      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo descargar la imagen desde esa URL.");

      const blob = await res.blob();
      const mime = blob.type || "image/jpeg";
      let ext = "jpg";
      if (mime === "image/png") ext = "png";
      else if (mime === "image/webp") ext = "webp";

      const f = new File([blob], `screenshot.${ext}`, { type: mime });
      applyBaseFile(f, url);
    } catch (err: any) {
      console.error("handleLoadScreenshotUrl error:", err);
      setErrorMsg(err.message ?? "No se pudo usar la captura desde URL.");
    }
  };

  // Init from query (si venís desde from-image-ai)
  useEffect(() => {
    const imageUrl = searchParams.get("imageUrl");
    const qTitle = searchParams.get("title") ?? "";
    const qSubtitle = searchParams.get("subtitle") ?? "";
    const qAlert = (searchParams.get("alertTag") ?? "") as AlertTag;

    if (qTitle) setTitle(qTitle);
    if (qSubtitle) {
      setUseSubtitle(true);
      setSubtitle(qSubtitle);
    }
    if (qAlert && ALERT_TAGS.includes(qAlert)) setAlertTag(qAlert);

    const qpPublishDate =
      searchParams.get("publishDate") ?? searchParams.get("publishedAt");
    if (qpPublishDate) setPublishDateIso(toISODateOnly(qpPublishDate));

    if (!imageUrl) return;

    (async () => {
      try {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error("No se pudo descargar la imagen inicial.");

        const blob = await res.blob();
        const mime = blob.type || "image/jpeg";
        let ext = "jpg";
        if (mime === "image/png") ext = "png";
        else if (mime === "image/webp") ext = "webp";

        const f = new File([blob], `image-from-article.${ext}`, { type: mime });
        applyBaseFile(f, imageUrl);
      } catch (err) {
        console.error("init error:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ LISTA: soporta distintos formatos del backend
  const loadImages = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const headers: HeadersInit = { Accept: "application/json" };

      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("news_access_token");
        if (token) headers["authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/editor-images/list", { method: "GET", headers });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Error HTTP ${res.status} al obtener la lista de imágenes`);
      }

      const data = await res.json();

      // soporta items | data | images | results
      const items =
        data?.items ??
        data?.data ??
        data?.images ??
        data?.results ??
        [];

      setImages(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error("[image-editor-embed] Error al cargar imágenes:", err);
      setListError(err.message ?? "Error al obtener la lista de imágenes.");
    } finally {
      setListLoading(false);
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
      !searchTerm || img.filename?.toLowerCase().includes(searchTerm.toLowerCase());

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
  const pagedImages = filteredImages.slice(startIndex, startIndex + PAGE_SIZE);

  const selectExistingAsBase = async (img: ImageItem) => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setResultUrl(null);

      const res = await fetch(img.url);
      if (!res.ok) throw new Error("No se pudo descargar la imagen seleccionada.");

      const blob = await res.blob();
      const mime = blob.type || "image/jpeg";

      let ext = "jpg";
      if (mime === "image/png") ext = "png";
      else if (mime === "image/webp") ext = "webp";

      const name = img.filename || `image-from-library.${ext}`;
      const f = new File([blob], name, { type: mime });

      applyBaseFile(f, img.url);

      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("selectExistingAsBase error:", err);
      setErrorMsg(err.message ?? "No se pudo usar esa imagen como base.");
    }
  };

  // Enhance
  const handleEnhance = async () => {
    if (!file) {
      setErrorMsg("Primero cargá una imagen (subí una, pegá una captura o elegí una RAW).");
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
        if (token) fd.append("accessToken", token);
      }

      const brandConfig = {
        brandName: "CANALIBERTARIO",
        claim: "NOTICIAS Y ANÁLISIS ECONÓMICOS Y POLÍTICOS DESDE UNA MIRADA LIBERTARIA",
        useHeaderWordmark: true,
        siteUrl: null,
        socialHandle: "@canallibertario",
        socialIcons: ["x", "facebook", "instagram"] as const,
        assets: {
          logoHorizontalPath: BRAND_LOGO_HORIZONTAL,
          lockupPath: BRAND_LOCKUP,
        },
      };

      const subtitleToSend = useSubtitle ? (subtitle.trim() || null) : null;

      const optionsJson: any = {
        title: title.trim() || null,
        subtitle: subtitleToSend,
        footer: null,
        footerDate: publishDateIso,
        publishDateIso,
        brand: brandConfig,
        alertTag: alertTag || null,
        useSocialIcons: true,
        layout: {
          textPosition: DEFAULT_LOOK.textPosition,
          textOffsetPct: DEFAULT_LOOK.textOffsetPct,
          overlayHeightPct: DEFAULT_LOOK.overlayHeightPct,
          overlayOpacity: 0.9,
          headerStrip: null,
          alertAlign: DEFAULT_LOOK.alertAlign,
          coverVariant: DEFAULT_LOOK.coverVariant,
          footerOpacity: DEFAULT_LOOK.footerOpacity,
          line2Opacity: DEFAULT_LOOK.line2Opacity,
          line2Weight: DEFAULT_LOOK.line2Weight,
        },
        colors: {
          theme,
          bottomBar: "rgba(0,0,0,0.85)",
          title: DEFAULT_LOOK.titleColor,
          subtitle: DEFAULT_LOOK.subtitleColor,
          footer: DEFAULT_LOOK.dateColor,
        },
        typography: {
          titleFontPx: DEFAULT_LOOK.titleFontPx,
          subtitleFontPx: DEFAULT_LOOK.subtitleFontPx,
          pillFontPx: DEFAULT_LOOK.pillFontPx,
          footerFontPx: DEFAULT_LOOK.footerFontPx,
        },
      };

      fd.append("optionsJson", JSON.stringify(optionsJson));

      const res = await fetch("/api/editor-images/enhance", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Error HTTP ${res.status} al procesar la imagen`);
      }

      const data = (await res.json()) as EnhanceResponse;

      if (!data.enhancedImageUrl) {
        throw new Error("La respuesta no contiene una URL de imagen procesada.");
      }

      setResultUrl(data.enhancedImageUrl);

      const urlLower = data.enhancedImageUrl.toLowerCase();
      const isCover =
        urlLower.includes("/covers/") ||
        urlLower.includes("/cover/") ||
        /[-_/]covers?[-_/]/.test(urlLower);

      setSuccessMsg(
        data.message ??
          (isCover
            ? "Cover generada correctamente (lista para publicar)."
            : "Imagen subida como RAW (no se pudo generar cover)."),
      );

      void loadImages();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Error al procesar la imagen con IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFullEditor = () => {
    if (typeof window === "undefined") return;

    const baseImageUrl = resultUrl || previewUrl;
    if (!baseImageUrl) {
      alert("Primero cargá una imagen o generá una cover.");
      return;
    }

    const q = new URLSearchParams({
      imageUrl: baseImageUrl,
      title,
      subtitle: useSubtitle ? subtitle : "",
      alertTag: alertTag || "",
      publishDate: publishDateIso || "",
      useSubtitle: useSubtitle ? "1" : "0",
      coverVariant: DEFAULT_LOOK.coverVariant,
    });

    window.open(`/admin/image-editor/full?${q.toString()}`, "_blank");
  };

  // Preview computed
  const mainPreviewUrl = previewUrl;
  const hasBaseImage = !!mainPreviewUrl;

  const displayTitle = title.trim() || "Título de la portada";
  const titleLines = displayTitle.split(/\r?\n/).slice(0, 3);
  const subtitleToRender = useSubtitle ? subtitle.trim() : "";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-900/80 bg-slate-950/95 text-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.95)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),transparent_60%)] opacity-80" />

        <section className="relative z-10 space-y-6 p-4 md:p-8">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Editor de imágenes · Covers (rápido)
            </div>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
              Generá una cover lista para publicar
            </h1>
            <p className="max-w-3xl text-sm text-slate-300">
              Cargá una imagen, poné título, elegí etiqueta/tema (opcional) y generá. El resto queda fijo.
            </p>
          </header>

          {/* Preview / Resultado */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Vista previa / Resultado
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={loading || !file}
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_35px_rgba(56,189,248,0.45)] hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-300"
                >
                  {loading ? "Procesando..." : "Generar cover"}
                </button>

                <button
                  type="button"
                  onClick={handleOpenFullEditor}
                  disabled={!previewUrl && !resultUrl}
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-sky-400 hover:bg-slate-800 disabled:opacity-50"
                >
                  Abrir Full
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-12">
              {/* PREVIEW */}
              <div className="xl:col-span-8 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Vista previa
                </div>

                {hasBaseImage ? (
                  <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                    <div className="relative aspect-video w-full">
                      <img
                        src={mainPreviewUrl!}
                        alt="Preview portada"
                        className="h-full w-full object-cover"
                        onClick={() => window.open(mainPreviewUrl!, "_blank")}
                        style={{ cursor: "zoom-in" }}
                      />

                      {showSafeArea && (
                        <>
                          <div
                            className="pointer-events-none absolute z-30 rounded-xl border border-white/20"
                            style={{
                              left: DEFAULT_LOOK.SAFE_X,
                              right: DEFAULT_LOOK.SAFE_X,
                              top: DEFAULT_LOOK.SAFE_TOP,
                              bottom: DEFAULT_LOOK.SAFE_BOTTOM,
                              boxShadow: "0 0 0 9999px rgba(0,0,0,0.06) inset",
                            }}
                          />
                          <div
                            className="pointer-events-none absolute z-30 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70"
                            style={{
                              left: DEFAULT_LOOK.SAFE_X,
                              bottom: DEFAULT_LOOK.SAFE_BOTTOM,
                            }}
                          >
                            safe area
                          </div>
                        </>
                      )}

                      {/* Overlay inferior fijo */}
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
                        style={{
                          height: `${DEFAULT_LOOK.overlayHeightPct}%`,
                          background: getBottomOverlay(theme),
                        }}
                      >
                        <div
                          className="flex h-full w-full flex-col justify-end"
                          style={{
                            paddingLeft: "32px",
                            paddingRight: "32px",
                            paddingBottom: "18px",
                            paddingTop: "18px",
                          }}
                        >
                          <div className="space-y-3">
                            {/* Pill */}
                            {alertTag && (
                              <div className="flex justify-start">
                                <div
                                  className="inline-flex items-center rounded-full px-3 py-1 font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_22px_rgba(0,0,0,0.25)]"
                                  style={{
                                    background: getPillBg(alertTag),
                                    fontSize: DEFAULT_LOOK.pillFontPx,
                                  }}
                                >
                                  {alertTag}
                                </div>
                              </div>
                            )}

                            {/* Title */}
                            <div
                              className="leading-[1.08] tracking-[0.02em]"
                              style={{
                                maxWidth: "860px",
                                color: DEFAULT_LOOK.titleColor,
                                textShadow: "0 10px 26px rgba(0,0,0,0.35)",
                              }}
                            >
                              <div
                                className="font-extrabold"
                                style={{ fontSize: DEFAULT_LOOK.titleFontPx, opacity: 1 }}
                              >
                                {titleLines[0] ?? ""}
                              </div>

                              {titleLines[1] ? (
                                <div
                                  style={{
                                    fontSize: Math.max(
                                      24,
                                      Math.round(DEFAULT_LOOK.titleFontPx * 0.86),
                                    ),
                                    fontWeight: DEFAULT_LOOK.line2Weight,
                                    opacity: DEFAULT_LOOK.line2Opacity,
                                  }}
                                >
                                  {titleLines[1]}
                                </div>
                              ) : null}

                              {titleLines[2] ? (
                                <div
                                  style={{
                                    fontSize: Math.max(
                                      22,
                                      Math.round(DEFAULT_LOOK.titleFontPx * 0.78),
                                    ),
                                    fontWeight: Math.max(
                                      650,
                                      Math.round(DEFAULT_LOOK.line2Weight - 50),
                                    ),
                                    opacity: Math.max(0.78, DEFAULT_LOOK.line2Opacity - 0.06),
                                  }}
                                >
                                  {titleLines[2]}
                                </div>
                              ) : null}
                            </div>

                            {/* Subtitle opcional */}
                            {subtitleToRender && (
                              <div
                                className="font-medium leading-snug"
                                style={{
                                  maxWidth: "860px",
                                  color: DEFAULT_LOOK.subtitleColor,
                                  textShadow: "0 8px 22px rgba(0,0,0,0.28)",
                                  fontSize: DEFAULT_LOOK.subtitleFontPx,
                                }}
                              >
                                {subtitleToRender}
                              </div>
                            )}

                            {/* Footer fijo */}
                            <div className="mt-2 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={BRAND_LOCKUP}
                                  alt="Canalibertario redes"
                                  className="h-7 w-auto"
                                  style={{ opacity: DEFAULT_LOOK.footerOpacity }}
                                />
                              </div>

                              <span
                                className="font-semibold uppercase tracking-[0.18em]"
                                style={{
                                  color: DEFAULT_LOOK.dateColor,
                                  textShadow: "0 8px 22px rgba(0,0,0,0.28)",
                                  fontSize: DEFAULT_LOOK.footerFontPx,
                                  opacity: DEFAULT_LOOK.footerOpacity,
                                }}
                              >
                                {publishDateAR}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300">
                    Subí una imagen, pegá una captura o elegí una RAW para ver la vista previa.
                  </p>
                )}

                {/* Avanzado */}
                <details className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                  <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Avanzado
                  </summary>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-[11px] text-slate-200">
                      <input
                        type="checkbox"
                        checked={showSafeArea}
                        onChange={(e) => setShowSafeArea(e.target.checked)}
                        className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                      />
                      Mostrar safe area
                    </label>

                    <button
                      type="button"
                      onClick={() => setPublishDateIso(toISODateOnly(null))}
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-400 hover:bg-slate-800"
                      title="Setea fecha de hoy"
                    >
                      Fecha hoy
                    </button>

                    <input
                      type="date"
                      value={publishDateIso}
                      onChange={(e) => setPublishDateIso(toISODateOnly(e.target.value))}
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-50 outline-none focus:border-sky-400"
                      title="Fecha de publicación"
                    />
                  </div>
                </details>
              </div>

              {/* RESULTADO */}
              <div className="xl:col-span-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Resultado
                </div>

                {resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Imagen generada"
                    className="w-full rounded-xl border border-emerald-500/70 object-cover"
                    onClick={() => window.open(resultUrl, "_blank")}
                    style={{ cursor: "zoom-in" }}
                  />
                ) : (
                  <div className="flex h-[240px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-400">
                    Todavía no generaste una cover.
                  </div>
                )}

                {errorMsg && (
                  <div className="mt-3 rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="mt-3 rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                    {successMsg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CONTROLES MINIMOS */}
          <div className="grid gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 md:grid-cols-12 md:p-6">
            <div className="md:col-span-6 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                1) Imagen base
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-50 hover:border-sky-400/80 hover:bg-slate-800">
                Seleccionar imagen
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>

              <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Pegá una captura (screenshot)
                </div>
                <textarea
                  rows={2}
                  value={screenshotInput}
                  onChange={(e) => setScreenshotInput(e.target.value)}
                  onPaste={handleScreenshotPaste}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                  placeholder="Ctrl+V para pegar imagen o pegá la URL..."
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-400">
                    Si pegás URL, tocá “Usar captura”.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadScreenshotUrl}
                    disabled={!screenshotInput.trim()}
                    className="whitespace-nowrap rounded-full border border-sky-400/80 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold text-sky-200 hover:bg-sky-500/20 disabled:opacity-40"
                  >
                    Usar captura
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-6 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                2) Texto (mínimo)
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Título</label>
                <textarea
                  rows={2}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                  placeholder="Ej: Milei anuncia medidas"
                />
                <p className="text-[10px] text-slate-400">
                  Podés usar <strong>Enter</strong> para forzar cortes.
                </p>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-slate-200">
                <input
                  type="checkbox"
                  checked={useSubtitle}
                  onChange={(e) => {
                    setUseSubtitle(e.target.checked);
                    if (!e.target.checked) setSubtitle("");
                  }}
                  className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                />
                Incluir bajada / descripción (opcional)
              </label>

              {useSubtitle && (
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Bajada</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    placeholder="Ej: Nuevo plan económico"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Etiqueta (opcional)</label>
                  <select
                    value={alertTag}
                    onChange={(e) => setAlertTag(e.target.value as AlertTag)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                  >
                    {ALERT_TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t ? t : "Sin etiqueta"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Tema</label>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {(["black", "purple", "sunset"] as CoverTheme[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`rounded-full border px-3 py-1 font-semibold ${
                          theme === t
                            ? "border-sky-400 bg-sky-500/10 text-sky-200"
                            : "border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400 hover:bg-slate-800"
                        }`}
                      >
                        {themeLabel(t)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] text-slate-300">
                <div className="font-semibold text-slate-200">Defaults (fijos)</div>
                <ul className="mt-1 list-disc pl-5 text-slate-400">
                  <li>Overlay + tipografías + layout: predefinidos</li>
                  <li>Footer: lockup + fecha</li>
                  <li>Sin sliders ni ajustes finos (eso va en Full)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ✅ BIBLIOTECA: abierta por defecto para que “se vea sí o sí” */}
          <details open className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 md:p-6">
            <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Biblioteca (RAW / Covers)
            </summary>

            <div className="mt-4">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Biblioteca de imágenes</h2>
                  <p className="text-xs text-slate-400">Elegí una RAW como base si no querés subir.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar..."
                    className="w-40 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px]"
                  />

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "all" | "raw" | "cover")}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px]"
                  >
                    <option value="all">Todas</option>
                    <option value="raw">RAW</option>
                    <option value="cover">Covers</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => void loadImages()}
                    disabled={listLoading}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold"
                  >
                    {listLoading ? "Actualizando..." : "Refrescar lista"}
                  </button>
                </div>
              </div>

              {listError && (
                <div className="mt-2 rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                  {listError}
                </div>
              )}

              {!listError && listLoading && images.length === 0 && (
                <p className="text-sm text-slate-400">Cargando imágenes…</p>
              )}

              {!listError && !listLoading && filteredImages.length === 0 && (
                <p className="text-sm text-slate-400">No hay imágenes para mostrar.</p>
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
                            <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
                          </div>

                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="truncate text-slate-100">{img.filename}</span>

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

                          <div className="mb-2 truncate text-[10px] text-slate-400">{img.url}</div>

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
                                    // ignore
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
                      de <span className="font-semibold">{filteredImages.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold hover:border-sky-400 hover:bg-slate-800 disabled:opacity-50"
                      >
                        Anterior
                      </button>

                      <span className="min-w-[90px] text-center">
                        Página {currentPage} de {totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold hover:border-sky-400 hover:bg-slate-800 disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
