// app/admin/image-editor-embed/page.tsx
// app/admin/image-editor/page.tsx
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

type TextPosition = "top" | "middle" | "bottom";
type CoverTheme = "purple" | "sunset" | "wine";

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

const ALERT_TAGS = ["", "URGENTE", "ALERTA", "ÚLTIMA HORA"] as const;
type AlertTag = (typeof ALERT_TAGS)[number];

const PALETTE = [
  "#ffffff",
  "#facc15",
  "#f97316",
  "#ef4444",
  "#22c55e",
  "#38bdf8",
] as const;

function ColorSwatches({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-slate-300">{label}</label>
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="h-6 w-6 rounded-full border border-slate-700"
            style={{
              backgroundColor: c,
              outline: value === c ? "2px solid #e5e7eb" : "none",
              boxShadow:
                value === c ? "0 0 0 1px rgba(15,23,42,0.9)" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ImageEditorEmbedPage() {
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  // footer apagado por defecto
  const [footer, setFooter] = useState("");
  const [alertTag, setAlertTag] = useState<AlertTag>("");

  const [textPosition, setTextPosition] = useState<TextPosition>("bottom");
  const [theme, setTheme] = useState<CoverTheme>("purple");

  const [titleColor, setTitleColor] = useState("#ffffff");
  const [subtitleColor, setSubtitleColor] = useState("#e5e7eb");
  const [handleColor, setHandleColor] = useState("#e5e7eb");

  // Cabecera tipo "La Derecha Diario"
  const [useHeaderStrip, setUseHeaderStrip] = useState(false);
  const [headerDate, setHeaderDate] = useState("");
  const [headerLabel, setHeaderLabel] = useState("");

  // Fondo / degradado agrandable
  const [overlayHeight, setOverlayHeight] = useState(38); // % de alto
  const [overlayOpacity, setOverlayOpacity] = useState(0.92); // 0–1

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "raw" | "cover">("all");
  const [page, setPage] = useState(1);

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
        "Primero seleccioná una imagen base (subí una o elegí un RAW de la biblioteca).",
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

      const safeFooter = footer.trim() || null;

      const brandConfig = {
        brandName: "CANALIBERTARIO",
        claim:
          "NOTICIAS Y ANÁLISIS ECONÓMICOS Y POLÍTICOS DESDE UNA MIRADA LIBERTARIA",
        useHeaderWordmark: true,
        siteUrl: safeFooter,
        socialHandle: "@canallibertario",
        socialIcons: ["x", "facebook", "instagram"] as const,
      };

      // mapeamos fecha + texto extra al footerLabel/footerDate para el renderer
      const footerLabel = useHeaderStrip ? headerLabel.trim() || null : null;
      const footerDate = useHeaderStrip ? headerDate.trim() || null : null;

      const optionsJson = {
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        footer: safeFooter,
        footerLabel,
        footerDate,
        brand: brandConfig,
        alertTag: alertTag || null,
        useSocialIcons: true,
        layout: {
          textPosition,
          overlayHeightPct: overlayHeight,
          overlayOpacity,
          headerStrip: useHeaderStrip
            ? {
                date: headerDate.trim() || null,
                label: headerLabel.trim() || null,
              }
            : null,
        },
        colors: {
          theme,
          bottomBar: "rgba(0,0,0,0.85)",
          title: titleColor,
          subtitle: subtitleColor,
          // color del handle se manda como "footer" para el backend
          footer: handleColor,
        },
      };

      fd.append("optionsJson", JSON.stringify(optionsJson));

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
            "Imagen procesada correctamente. Se generó una portada (cover) lista para usar.",
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
      subtitle,
      footer,
      alertTag: alertTag || "",
      textPosition,
    });

    window.open(`/admin/image-editor/full?${q.toString()}`, "_blank");
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
          text || `Error HTTP ${res.status} al obtener la lista de imágenes`,
        );
      }

      const data = (await res.json()) as { items: ImageItem[] };
      setImages(data.items ?? []);
    } catch (err: any) {
      console.error("[image-editor-embed] Error al cargar imágenes:", err);
      setListError(err.message ?? "Error al obtener la lista de imágenes.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (initializedFromQuery) return;

    const imageUrl = searchParams.get("imageUrl");
    const overlayTitle =
      searchParams.get("overlayTitle") ?? searchParams.get("title") ?? "";
    const overlaySubtitle =
      searchParams.get("overlaySubtitle") ??
      searchParams.get("subtitle") ??
      "";
    const overlayFooter =
      searchParams.get("overlayFooter") ?? searchParams.get("footer") ?? "";

    const qpTextPos = searchParams.get("textPosition");
    if (
      qpTextPos === "top" ||
      qpTextPos === "middle" ||
      qpTextPos === "bottom"
    ) {
      setTextPosition(qpTextPos);
    }

    if (overlayTitle) setTitle(overlayTitle);
    if (overlaySubtitle) setSubtitle(overlaySubtitle);
    if (overlayFooter) setFooter(overlayFooter);

    if (imageUrl) {
      (async () => {
        try {
          const res = await fetch(imageUrl);
          if (!res.ok)
            throw new Error("No se pudo descargar la imagen inicial.");

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
          console.error("init error:", err);
        } finally {
          setInitializedFromQuery(true);
        }
      })();
    } else {
      setInitializedFromQuery(true);
    }
  }, [initializedFromQuery, searchParams]);

  const selectExistingAsBase = async (img: ImageItem) => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setResultUrl(null);

      const res = await fetch(img.url);
      if (!res.ok)
        throw new Error("No se pudo descargar la imagen seleccionada.");

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
      console.error("selectExistingAsBase error:", err);
      setErrorMsg(err.message ?? "No se pudo usar esa imagen como base.");
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
    startIndex + PAGE_SIZE,
  );

  function themeLabel(value: CoverTheme): string {
    switch (value) {
      case "purple":
        return "Canalibertario (violeta)";
      case "sunset":
        return "Sunset / Urgente (naranja)";
      case "wine":
        return "Wine / Impacto (bordó)";
      default:
        return value;
    }
  }

  // URL principal para la vista previa: portada procesada o, si no, la base
  const mainPreviewUrl = resultUrl || previewUrl;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      {/* PANEL PRINCIPAL */}
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
              Subí una imagen o elegí una RAW de la biblioteca. Después definí
              el título, la bajada, la etiqueta y la firma CANALIBERTARIO. La
              salida es una cover horizontal 1280×720 pensada para X/Twitter,
              Facebook e Instagram (post clásico).
            </p>
          </header>

          <div className="grid gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 md:grid-cols-2 md:p-6">
            {/* IZQUIERDA */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                1. Cargar imagen base
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-50 hover:border-sky-400/80 hover:bg-slate-800">
                Seleccionar imagen de portada
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

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
                    placeholder="Ej: Milei anuncia medidas"
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

                <div className="space-y-2 rounded-lg border border-slate-800/70 bg-slate-900/60 p-2">
                  <label className="flex items-center gap-2 text-[11px] text-slate-200">
                    <input
                      type="checkbox"
                      checked={useHeaderStrip}
                      onChange={(e) => setUseHeaderStrip(e.target.checked)}
                      className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                    />
                    Mostrar franja superior (fecha / contexto)
                  </label>

                  {useHeaderStrip && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300">
                          Fecha / momento
                        </label>
                        <input
                          type="text"
                          value={headerDate}
                          onChange={(e) => setHeaderDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                          placeholder="Ej: 05 de diciembre 2025 · 04:30 PM"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300">
                          Texto extra (opcional)
                        </label>
                        <input
                          type="text"
                          value={headerLabel}
                          onChange={(e) => setHeaderLabel(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                          placeholder="Ej: Cobertura especial · Elecciones Honduras"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    Sitio del canal
                  </label>
                  <input
                    type="text"
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    placeholder="www.canalibertario.com (opcional)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    Posición del bloque de texto
                  </label>
                  <select
                    value={textPosition}
                    onChange={(e) =>
                      setTextPosition(e.target.value as TextPosition)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                  >
                    <option value="bottom">Inferior (clásico)</option>
                    <option value="middle">Centro</option>
                    <option value="top">Superior</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    Tema de color de la barra
                  </label>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {(["purple", "sunset", "wine"] as CoverTheme[]).map((t) => (
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

                {/* Controles de fondo / degradado */}
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">
                      Altura del fondo (barra)
                    </label>
                    <input
                      type="range"
                      min={25}
                      max={60}
                      value={overlayHeight}
                      onChange={(e) =>
                        setOverlayHeight(Number(e.target.value) || 25)
                      }
                      className="w-full"
                    />
                    <div className="text-[10px] text-slate-400">
                      {overlayHeight}% de la altura de la imagen.
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">
                      Opacidad del fondo
                    </label>
                    <input
                      type="range"
                      min={40}
                      max={100}
                      value={Math.round(overlayOpacity * 100)}
                      onChange={(e) =>
                        setOverlayOpacity(
                          Math.max(
                            0.4,
                            Math.min(1, Number(e.target.value) / 100),
                          ),
                        )
                      }
                      className="w-full"
                    />
                    <div className="text-[10px] text-slate-400">
                      {Math.round(overlayOpacity * 100)}% — tipo “glass”:
                      desde semi-transparente hasta casi sólido.
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid gap-3 md:grid-cols-3">
                  <ColorSwatches
                    label="Color título"
                    value={titleColor}
                    onChange={setTitleColor}
                  />
                  <ColorSwatches
                    label="Color bajada"
                    value={subtitleColor}
                    onChange={setSubtitleColor}
                  />
                  <ColorSwatches
                    label="Color @canallibertario"
                    value={handleColor}
                    onChange={setHandleColor}
                  />
                </div>
              </div>
            </div>

            {/* DERECHA */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                2. Vista previa
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                {mainPreviewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={mainPreviewUrl}
                      alt="Preview portada"
                      className="max-h-64 w-full rounded-lg border border-slate-800 object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-300">
                    Subí una imagen o elegí una RAW para ver la vista previa.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-[11px]">
                <div className="mb-1 font-semibold text-slate-200">
                  Textos que se enviarán:
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>
                    <b>Título:</b> {title || "—"}
                  </div>
                  <div>
                    <b>Bajada:</b> {subtitle || "—"}
                  </div>
                  <div>
                    <b>Etiqueta:</b> {alertTag || "(sin)"}{" "}
                  </div>
                  <div>
                    <b>Cabecera:</b>{" "}
                    {useHeaderStrip
                      ? `${headerDate || "—"} · ${
                          headerLabel || "sin texto extra"
                        }`
                      : "desactivada"}
                  </div>
                  <div>
                    <b>Firma:</b>{" "}
                    {(footer || "(sin sitio)") +
                      " + X / Facebook / Instagram"}
                  </div>
                  <div>
                    <b>Posición texto:</b>{" "}
                    {textPosition === "bottom"
                      ? "Inferior"
                      : textPosition === "middle"
                      ? "Centro"
                      : "Superior"}
                  </div>
                  <div>
                    <b>Tema de color:</b> {themeLabel(theme)}
                  </div>
                  <div>
                    <b>Fondo:</b> altura {overlayHeight}% · opacidad{" "}
                    {Math.round(overlayOpacity * 100)}%
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnhance}
                disabled={loading || !file}
                className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_35px_rgba(56,189,248,0.45)] hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-300"
              >
                {loading ? "Procesando..." : "Mejorar imagen con IA"}
              </button>

              <button
                type="button"
                onClick={handleOpenFullEditor}
                disabled={!previewUrl && !resultUrl}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-sky-400 hover:bg-slate-800 disabled:opacity-50"
              >
                Abrir editor en pantalla completa
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

      {/* BIBLIOTECA */}
      <section className="mt-6 rounded-3xl border border-slate-900/80 bg-slate-950/95 p-4 text-slate-50">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Biblioteca de imágenes</h2>
            <p className="text-xs text-slate-400">
              RAW + covers generadas automáticamente.
            </p>
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
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | "raw" | "cover")
              }
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

        {!listError && filteredImages.length === 0 && (
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
                de{" "}
                <span className="font-semibold">
                  {filteredImages.length}
                </span>
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
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold hover:border-sky-400 hover:bg-slate-800 disabled:opacity-50"
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
