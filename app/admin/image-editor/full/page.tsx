// app/admin/image-editor/full/page.tsx
"use client";

import {
  useState,
  useEffect,
  useRef,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useSearchParams } from "next/navigation";

type TextPosition = "top" | "middle" | "bottom";
type CoverTheme = "purple" | "sunset" | "wine" | "blue" | "black";

const ALERT_TAGS = ["", "URGENTE", "ALERTA", "ÚLTIMA HORA"] as const;
type AlertTag = (typeof ALERT_TAGS)[number];

type DragTarget = "block" | "title" | "subtitle" | "resize" | "alert" | null;

type DragState = {
  target: DragTarget;
  startX: number;
  startY: number;
  blockTop: number;
  blockHeight: number;
  titleOffsetX: number;
  titleOffsetY: number;
  subtitleOffsetX: number;
  subtitleOffsetY: number;
  alertOffsetX: number;
  alertOffsetY: number;
} | null;

// Paleta unificada: blanco, negro, púrpura, naranja, rojo, azul
const BASE_COLORS = [
  "#ffffff", // blanco
  "#000000", // negro
  "#6d28d9", // púrpura
  "#f97316", // naranja
  "#ef4444", // rojo
  "#0ea5e9", // azul
] as const;


const TITLE_COLORS = [...BASE_COLORS];
const SUBTITLE_COLORS = [...BASE_COLORS];
const BRAND_COLORS = [...BASE_COLORS];
const TAG_COLORS = [...BASE_COLORS];


const DEFAULT_BLOCK_HEIGHT = 130;
const FOOTER_HEIGHT = 46;
const PREVIEW_HEIGHT_FALLBACK = 360;

function themeLabel(value: CoverTheme): string {
  switch (value) {
    case "purple":
      return "Canalibertario (violeta)";
    case "sunset":
      return "Sunset / Urgente (naranja)";
    case "wine":
      return "Wine / Impacto (bordó)";
    case "blue":
      return "Azul / Institucional";
    case "black":
      return "Negro / Luto / Máximo contraste";
    default:
      return value;
  }
}

function getThemePreviewColors(theme: CoverTheme) {
  switch (theme) {
    case "sunset":
      return {
        bandFrom: "rgba(15,23,42,0.0)",
        bandMid: "rgba(15,23,42,0.45)",
        bandTo: "rgba(249,115,22,0.96)",
        footerBg: "#7c2d12",
        footerBorder: "#f97316",
      };
    case "wine":
      return {
        bandFrom: "rgba(2,6,23,0.0)",
        bandMid: "rgba(15,23,42,0.45)",
        bandTo: "rgba(185,28,28,0.96)",
        footerBg: "#450a0a",
        footerBorder: "#b91c1c",
      };
    case "blue":
      return {
        bandFrom: "rgba(15,23,42,0.0)",
        bandMid: "rgba(15,23,42,0.45)",
        bandTo: "rgba(37,99,235,0.96)",
        footerBg: "#020617",
        footerBorder: "#0ea5e9",
      };
    case "black":
      return {
        bandFrom: "rgba(15,23,42,0.0)",
        bandMid: "rgba(15,23,42,0.7)",
        bandTo: "rgba(0,0,0,0.98)",
        footerBg: "#020617",
        footerBorder: "#64748b",
      };
    case "purple":
    default:
      return {
        bandFrom: "rgba(2,6,23,0.0)",
        bandMid: "rgba(15,23,42,0.45)",
        bandTo: "rgba(109,40,217,0.96)",
        footerBg: "#020617",
        footerBorder: "#4338ca",
      };
  }
}

export default function ImageEditorFullPage() {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // altura real del área 16:9
  const [previewHeight, setPreviewHeight] = useState(PREVIEW_HEIGHT_FALLBACK);

  // Imagen base
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Textos
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [footer, setFooter] = useState("www.canalibertario.com");
  const [alertTag, setAlertTag] = useState<AlertTag>("");

  // Franja superior (fecha / contexto)
  const [showHeaderStrip, setShowHeaderStrip] = useState(false);
  const [headerDate, setHeaderDate] = useState("");
  const [headerLabel, setHeaderLabel] = useState("");

  // Colores
  const [titleColor, setTitleColor] = useState("#ffffff");
  const [subtitleColor, setSubtitleColor] = useState("#e5e7eb");
  const [brandColor, setBrandColor] = useState("#ffffff");
  const [alertColor, setAlertColor] = useState("#f97316");

  // Tema de color – por defecto negro
  const [theme, setTheme] = useState<CoverTheme>("black");

  // Tamaños de fuente (título más chico por defecto)
  const [titleSize, setTitleSize] = useState(32);
  const [subtitleSize, setSubtitleSize] = useState(20);

  // Posición del bloque
  const [blockTop, setBlockTop] = useState(260);
  const [blockHeight, setBlockHeight] = useState(DEFAULT_BLOCK_HEIGHT);
  const [initialBlockTop, setInitialBlockTop] = useState(260);
  const [textPosition, setTextPosition] = useState<TextPosition>("bottom");

  // Opacidad del fondo (0.4 – 1) – por defecto 100%
  const [overlayOpacity, setOverlayOpacity] = useState(1);

  // Offsets internos para título y bajada
  const [titleOffsetX, setTitleOffsetX] = useState(40);
  const [titleOffsetY, setTitleOffsetY] = useState(30);
  const [subtitleOffsetX, setSubtitleOffsetX] = useState(40);
  const [subtitleOffsetY, setSubtitleOffsetY] = useState(80);

  // Offset para la etiqueta
  const [alertOffsetX, setAlertOffsetX] = useState(40);
  const [alertOffsetY, setAlertOffsetY] = useState(10);

  // Drag
  const [drag, setDrag] = useState<DragState>(null);

  // Estado general
  const [loadingImage, setLoadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // medir altura real del viewport 16:9
  useEffect(() => {
    function updateHeight() {
      if (!previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      if (rect.height > 0) {
        setPreviewHeight(rect.height);
      }
    }

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [previewUrl]);

  // ==========================
  // INIT DESDE QUERY STRING
  // ==========================
  useEffect(() => {
    const imageUrl = searchParams.get("imageUrl");
    const initialTitle = searchParams.get("title") ?? "";
    const initialSubtitle = searchParams.get("subtitle") ?? "";
    const initialFooter =
      searchParams.get("footer") ?? "www.canalibertario.com";
    const initialAlert =
      (searchParams.get("alertTag") as AlertTag | null) ?? "";
    const qpTheme = searchParams.get("theme") as CoverTheme | null;

    const qpHeaderEnabled = searchParams.get("headerEnabled") === "1";
    const qpHeaderDate = searchParams.get("headerDate") ?? "";
    const qpHeaderLabel = searchParams.get("headerLabel") ?? "";

    setTitle(initialTitle);
    setSubtitle(initialSubtitle);
    setFooter(initialFooter);
    setAlertTag(initialAlert);

    setShowHeaderStrip(qpHeaderEnabled);
    if (qpHeaderDate) setHeaderDate(qpHeaderDate);
    if (qpHeaderLabel) setHeaderLabel(qpHeaderLabel);

    if (
      qpTheme === "purple" ||
      qpTheme === "sunset" ||
      qpTheme === "wine" ||
      qpTheme === "blue" ||
      qpTheme === "black"
    ) {
      setTheme(qpTheme);
    }

    const textPosParam = searchParams.get(
      "textPosition",
    ) as TextPosition | null;

    let pos: TextPosition = "bottom";
    let startTop = 260;

    if (textPosParam === "top") {
      pos = "top";
      startTop = 90;
    } else if (textPosParam === "middle") {
      pos = "middle";
      startTop = 170;
    } else {
      pos = "bottom";
      startTop = 260;
    }

    setTextPosition(pos);
    setBlockTop(startTop);
    setInitialBlockTop(startTop);
    setBlockHeight(DEFAULT_BLOCK_HEIGHT);
    setTitleOffsetX(40);
    setTitleOffsetY(30);
    setSubtitleOffsetX(40);
    setSubtitleOffsetY(80);
    setAlertOffsetX(40);
    setAlertOffsetY(10);

    if (!imageUrl) return;

    (async () => {
      try {
        setLoadingImage(true);
        setErrorMsg(null);

        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error("No se pudo descargar la imagen base");

        const blob = await res.blob();
        const mime = blob.type || "image/jpeg";
        let ext = "jpg";
        if (mime === "image/png") ext = "png";
        else if (mime === "image/webp") ext = "webp";

        const f = new File([blob], `image-from-url.${ext}`, { type: mime });
        setFile(f);
        setPreviewUrl(imageUrl);
      } catch (err: any) {
        console.error("[editor-full] error al cargar imagen inicial:", err);
        setErrorMsg(
          err?.message ?? "No se pudo cargar la imagen inicial para editar.",
        );
      } finally {
        setLoadingImage(false);
      }
    })();
  }, [searchParams]);

  // ==========================
  // HANDLERS IMAGEN LOCAL
  // ==========================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setErrorMsg(null);
    setStatusMsg(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  // ==========================
  // DRAG HANDLERS
  // ==========================
  const startDrag = (target: DragTarget, e: ReactMouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;

    setDrag({
      target,
      startX: e.clientX,
      startY: e.clientY,
      blockTop,
      blockHeight,
      titleOffsetX,
      titleOffsetY,
      subtitleOffsetX,
      subtitleOffsetY,
      alertOffsetX,
      alertOffsetY,
    });
  };

  useEffect(() => {
    if (!drag) return;

    const handleMove = (ev: MouseEvent) => {
      if (!drag) return;
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;

      const h = previewHeight || PREVIEW_HEIGHT_FALLBACK;

      switch (drag.target) {
        case "block": {
          const minTop = 40;
          const maxTop = h - drag.blockHeight;
          const newTop = drag.blockTop + dy;
          setBlockTop(Math.min(maxTop, Math.max(minTop, newTop)));
          break;
        }
        case "resize": {
          const minHeight = 90;
          const maxHeight = 240;
          const newH = drag.blockHeight + dy;
          setBlockHeight(Math.min(maxHeight, Math.max(minHeight, newH)));
          break;
        }
        case "title": {
          setTitleOffsetX(drag.titleOffsetX + dx);
          setTitleOffsetY(drag.titleOffsetY + dy);
          break;
        }
        case "subtitle": {
          setSubtitleOffsetX(drag.subtitleOffsetX + dx);
          setSubtitleOffsetY(drag.subtitleOffsetY + dy);
          break;
        }
        case "alert": {
          setAlertOffsetX(drag.alertOffsetX + dx);
          setAlertOffsetY(drag.alertOffsetY + dy);
          break;
        }
        default:
          break;
      }
    };

    const handleUp = () => {
      setDrag(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [drag, previewHeight]);

  // ==========================
  // RESET POSITIONS
  // ==========================
  function resetPositions() {
    setBlockTop(initialBlockTop);
    setBlockHeight(DEFAULT_BLOCK_HEIGHT);
    setTitleOffsetX(40);
    setTitleOffsetY(30);
    setSubtitleOffsetX(40);
    setSubtitleOffsetY(80);
    setAlertOffsetX(40);
    setAlertOffsetY(10);
  }

  // ==========================
  // GENERAR COVER (BACKEND)
  // ==========================
  const handleGenerate = async () => {
    if (!file) {
      setErrorMsg(
        "Primero seleccioná una imagen base (o asegurate que se haya cargado la del artículo).",
      );
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const fd = new FormData();
      fd.append("image", file);

      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("news_access_token");
        if (token) fd.append("accessToken", token);
      }

      const safeFooter = footer.trim() || null;

      const brandConfig = {
        brandName: "CANALIBERTARIO",
        claim:
          "NOTICIAS Y ANÁLISIS ECONÓMICOS Y POLÍTICOS DESDE UNA MIRADA LIBERTARIA",
        useHeaderWordmark: true,
        siteUrl: safeFooter,
        socialHandle: "@canalibertario",
        socialIcons: ["x", "facebook", "instagram"] as const,
      };

      const effectiveHeight = previewHeight || PREVIEW_HEIGHT_FALLBACK;

      const overlayHeightPct = Math.round(
        (blockHeight / (effectiveHeight || PREVIEW_HEIGHT_FALLBACK)) * 100,
      );

      const textOffsetYPct =
        effectiveHeight > 0
          ? ((blockTop - initialBlockTop) / effectiveHeight) * 100
          : 0;

      const layout = {
        textPosition,
        textOffsetYPct,
        titleFontPx: titleSize,
        subtitleFontPx: subtitleSize,
        overlayHeightPct,
        overlayOpacity,
        headerStrip: showHeaderStrip
          ? {
            date: headerDate || null,
            label: headerLabel || null,
          }
          : null,
      };

      const colors = {
        theme,
        title: titleColor,
        subtitle: subtitleColor,
        handle: brandColor,
        alertBg: alertColor,
      };

      const options = {
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        footer: safeFooter,
        brand: brandConfig,
        alertTag: alertTag || null,
        useSocialIcons: true,
        layout,
        colors,
      };

      fd.append("optionsJson", JSON.stringify(options));

      const res = await fetch("/api/editor-images/enhance", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Error HTTP ${res.status} al generar la portada`);
      }

      const data = await res.json().catch(() => null);
      const coverUrl: string | null =
        data?.enhancedImageUrl ?? data?.url ?? null;

      setStatusMsg(
        data?.message ??
        "Imagen procesada correctamente. Se generó una portada (cover) lista para usar.",
      );

      if (coverUrl && typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(coverUrl);
          setStatusMsg(
            (prev) =>
              (prev ?? "") + " La URL de la portada se copió al portapapeles.",
          );
        } catch {
          // ignorar error de clipboard
        }
      }

      if (
        coverUrl &&
        typeof window !== "undefined" &&
        window.opener &&
        window.location
      ) {
        try {
          window.opener.postMessage(
            {
              type: "editor-image-url",
              url: coverUrl,
            },
            window.location.origin,
          );
        } catch {
          // ignorar si el opener no acepta el mensaje
        }
      }
    } catch (err: any) {
      console.error("[editor-full] error:", err);
      setErrorMsg(err?.message ?? "Error al generar la portada con IA.");
    } finally {
      setSaving(false);
    }
  };

  const themeColors = getThemePreviewColors(theme);
  const effectiveHeight = previewHeight || PREVIEW_HEIGHT_FALLBACK;
  const overlayHeightPct = Math.round(
    (blockHeight / (effectiveHeight || PREVIEW_HEIGHT_FALLBACK)) * 100,
  );

  // ==========================
  // RENDER
  // ==========================
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:py-8">
        {/* COLUMNA IZQUIERDA: PREVIEW + COLORES */}
        <div className="flex-1 space-y-4">
          <header className="mb-2 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Editor de portadas · Pantalla completa
            </div>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
              Ajustá textos y vista previa en grande antes de generar la cover.
            </h1>
          </header>

          {/* PREVIEW */}
          <section
            ref={containerRef}
            className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/90 shadow-[0_32px_90px_rgba(15,23,42,0.95)]"
          >
            <div className="flex items-center justify-between px-6 pt-4 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              <span>Vista previa 16:9</span>
              <span>
                Recomendado para X / Facebook / Instagram (1280x720 aprox.)
              </span>
            </div>

            <div
              ref={previewRef}
              className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-800 bg-black/60"
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Imagen base"
                    className="h-full w-full object-cover"
                  />

                  {/* FRANJA SUPERIOR */}
                  {showHeaderStrip && (headerDate || headerLabel) && (
                    <div
                      className="absolute inset-x-0 flex items-center justify-between px-6 text-xs"
                      style={{
                        top: 0,
                        height: 40,
                        backgroundColor: themeColors.footerBg,
                        borderBottom: `1px solid ${themeColors.footerBorder}`,
                      }}
                    >
                      <span className="font-semibold text-slate-200">
                        {headerDate || "Fecha / sitio del canal"}
                      </span>
                      {headerLabel && (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                          {headerLabel}
                        </span>
                      )}
                    </div>
                  )}

                  {/* BLOQUE DEGRADADO */}
                  <div
                    className="absolute left-0 right-0 cursor-move"
                    style={{
                      top: blockTop,
                      height: blockHeight,
                      background: `linear-gradient(to bottom, ${themeColors.bandFrom} 0%, ${themeColors.bandMid} 40%, ${themeColors.bandTo} 100%)`,
                      opacity: overlayOpacity,
                    }}
                    onMouseDown={(e) => startDrag("block", e)}
                  >
                    <div className="relative h-full w-full">
                      {/* ETIQUETA */}
                      {alertTag && (
                        <div
                          className="absolute inline-flex cursor-move select-none items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-[0_4px_20px_rgba(0,0,0,0.7)]"
                          style={{
                            left: alertOffsetX,
                            top: alertOffsetY,
                            backgroundColor: alertColor,
                            color:
                              alertColor.toLowerCase() === "#ffffff" ? "#000000" : "#ffffff",
                          }}
                          onMouseDown={(e) => startDrag("alert", e)}
                        >
                          {alertTag}
                        </div>
                      )}


                      {/* TÍTULO */}
                      {title && (
                        <span
                          className="absolute cursor-move select-none font-extrabold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                          style={{
                            left: titleOffsetX,
                            top: titleOffsetY,
                            fontSize: `${titleSize}px`,
                            color: titleColor,
                            whiteSpace: "pre-line",
                            maxWidth: "80%",
                          }}
                          onMouseDown={(e) => startDrag("title", e)}
                        >
                          {title}
                        </span>
                      )}

                      {/* BAJADA */}
                      {subtitle && (
                        <span
                          className="absolute max-w-[65%] cursor-move select-none font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
                          style={{
                            left: subtitleOffsetX,
                            top: subtitleOffsetY,
                            fontSize: `${subtitleSize}px`,
                            color: subtitleColor,
                            whiteSpace: "pre-line",
                          }}
                          onMouseDown={(e) => startDrag("subtitle", e)}
                        >
                          {subtitle}
                        </span>
                      )}

                      {/* HANDLE ALTURA BLOQUE */}
                      <div
                        className="absolute bottom-2 left-[10%] right-[10%] h-1.5 cursor-ns-resize rounded-full bg-slate-200/80"
                        onMouseDown={(e) => startDrag("resize", e)}
                      />
                    </div>
                  </div>

                  {/* FOOTER FIJO ABAJO */}
                  <div
                    className="absolute inset-x-0 flex items-center justify-between px-8 text-xs"
                    style={{
                      bottom: 0,
                      height: FOOTER_HEIGHT,
                      backgroundColor: themeColors.footerBg,
                      borderTop: `1px solid ${themeColors.footerBorder}`,
                    }}
                  >
                    <span className="font-semibold text-slate-200">
                      {footer.trim() || null}
                    </span>
                    <div className="flex items-center gap-4 text-slate-100">
                      <span
                        className="text-sm font-extrabold"
                        style={{ color: brandColor }}
                      >
                        @canalibertario
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70">
                          X
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70">
                          f
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[11px]">
                          ig
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  {loadingImage
                    ? "Cargando imagen..."
                    : "No hay imagen base. Volvé desde el panel principal o seleccioná una imagen nueva."}
                </div>
              )}
            </div>

            {/* COLORES Y TEMA */}
            <div className="mt-4 rounded-b-3xl border-t border-slate-800 bg-slate-950/80 px-6 py-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Colores y tema
              </h2>

              <div className="space-y-3 text-[11px]">
                {/* TEMA */}
                <div className="space-y-2">
                  <span className="block text-slate-300">
                    Tema de color de la barra
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["purple", "sunset", "wine", "blue", "black", "white"] as CoverTheme[]
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${theme === t
                          ? "border-sky-400 bg-sky-500/10 text-sky-100"
                          : "border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400/70"
                          }`}
                      >
                        {themeLabel(t)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* COLOR TÍTULO */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-32 text-slate-300">Color título</span>
                  <div className="flex items-center gap-1">
                    {TITLE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTitleColor(c)}
                        className={`h-5 w-5 rounded-full border ${titleColor === c
                          ? "border-sky-400 ring-2 ring-sky-400/60"
                          : "border-slate-600"
                          }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-slate-400">{titleColor}</span>
                </div>

                {/* COLOR BAJADA */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-32 text-slate-300">Color bajada</span>
                  <div className="flex items-center gap-1">
                    {SUBTITLE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSubtitleColor(c)}
                        className={`h-5 w-5 rounded-full border ${subtitleColor === c
                          ? "border-sky-400 ring-2 ring-sky-400/60"
                          : "border-slate-600"
                          }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-slate-400">{subtitleColor}</span>
                </div>

                {/* COLOR BRAND */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-32 text-slate-300">
                    Color @canalibertario + iconos
                  </span>
                  <div className="flex items-center gap-1">
                    {BRAND_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBrandColor(c)}
                        className={`h-5 w-5 rounded-full border ${brandColor === c
                          ? "border-sky-400 ring-2 ring-sky-400/60"
                          : "border-slate-600"
                          }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-slate-400">{brandColor}</span>
                </div>

                {/* COLOR ETIQUETA */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-32 text-slate-300">Color etiqueta</span>
                  <div className="flex items-center gap-1">
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAlertColor(c)}
                        className={`h-5 w-5 rounded-full border ${alertColor === c
                          ? "border-sky-400 ring-2 ring-sky-400/60"
                          : "border-slate-600"
                          }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-slate-400">{alertColor}</span>
                </div>

                <button
                  type="button"
                  onClick={resetPositions}
                  className="mt-2 inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:border-sky-400 hover:bg-slate-800"
                >
                  Reiniciar posiciones
                </button>

                <p className="mt-1 text-[10px] text-slate-400">
                  Tip: arrastrá el bloque degradado directamente sobre la imagen
                  para moverlo arriba o abajo. El borde inferior del bloque
                  ajusta la altura. El footer se mantiene fijo al borde inferior.
                  El título, la bajada y la etiqueta también se pueden mover de forma independiente.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA */}
        <aside className="w-full max-w-md space-y-4">
          {/* IMAGEN BASE + TEXTOS */}
          <section className="space-y-4 rounded-3xl border border-slate-900 bg-slate-950/90 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Imagen base
            </h2>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-50 hover:border-sky-400/80 hover:bg-slate-800">
              Seleccionar nueva imagen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {previewUrl && (
              <p className="truncate text-[11px] text-slate-400">
                Usando como base:{" "}
                <span className="font-mono text-slate-300">{previewUrl}</span>
              </p>
            )}

            {/* TEXTOS */}
            <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Textos
              </h3>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">
                  Título principal
                  <span className="ml-1 text-[10px] text-slate-500">
                    (Enter agrega salto de línea)
                  </span>
                </label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">
                  Bajada / descripción
                  <span className="ml-1 text-[10px] text-slate-500">
                    (también acepta saltos de línea)
                  </span>
                </label>
                <textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  rows={2}
                  className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                />
              </div>

              {/* Franja superior */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={showHeaderStrip}
                    onChange={(e) => setShowHeaderStrip(e.target.checked)}
                    className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                  />
                  Mostrar franja superior (fecha / contexto)
                </label>

                {showHeaderStrip && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={headerDate}
                      onChange={(e) => setHeaderDate(e.target.value)}
                      placeholder="06/12/2025 - 20:57"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    />
                    <input
                      type="text"
                      value={headerLabel}
                      onChange={(e) => setHeaderLabel(e.target.value)}
                      placeholder="Ej: ECONOMÍA / POLÍTICA, etc."
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">
                  Sitio / firma
                </label>
                <input
                  type="text"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
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

              {/* SLIDERS TAMAÑO TEXTO + FONDO */}
              <div className="mt-3 space-y-3 border-t border-slate-800 pt-3 text-[11px] text-slate-300">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span>Tamaño título</span>
                    <span className="text-slate-400">{titleSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={24}
                    max={48}
                    value={titleSize}
                    onChange={(e) => setTitleSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span>Tamaño bajada</span>
                    <span className="text-slate-400">{subtitleSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={32}
                    value={subtitleSize}
                    onChange={(e) =>
                      setSubtitleSize(Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>

                {/* Altura del fondo */}
                <div className="border-t border-slate-800 pt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span>Altura del fondo (barra)</span>
                    <span className="text-slate-400">
                      {overlayHeightPct}% altura imagen
                    </span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={60}
                    value={overlayHeightPct}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      const h = previewHeight || PREVIEW_HEIGHT_FALLBACK;
                      const newHeight = Math.round((pct / 100) * h);
                      setBlockHeight(newHeight);
                    }}
                    className="w-full"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    38% ≈ tipo Derecha Diario; menor sube la barra, mayor cubre
                    más la imagen.
                  </p>
                </div>

                {/* Opacidad del fondo */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span>Opacidad del fondo</span>
                    <span className="text-slate-400">
                      {Math.round(overlayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    value={Math.round(overlayOpacity * 100)}
                    onChange={(e) =>
                      setOverlayOpacity(Number(e.target.value) / 100)
                    }
                    className="w-full"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    100% = fondo sólido. Bajá el valor si querés más efecto
                    “glass” dejando ver más la foto.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* RESUMEN + BOTÓN */}
          <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-950/90 p-5 text-[11px]">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Resumen a enviar
            </h3>

            <div className="space-y-1 text-slate-300">
              <div>
                <b>Título:</b> {title || "—"}
              </div>
              <div>
                <b>Bajada:</b> {subtitle || "—"}
              </div>
              <div>
                <b>Etiqueta:</b> {alertTag || "(sin)"}{" "}
                {alertTag && `· color ${alertColor}`}
              </div>
              <div>
                <b>Franja superior:</b>{" "}
                {showHeaderStrip
                  ? `${headerDate || "sin fecha"} · ${headerLabel || "sin etiqueta"
                  }`
                  : "desactivada"}
              </div>
              <div>
                <b>Firma:</b>{" "}
                {(footer || null) + " + X / Facebook / Instagram"}
              </div>
              <div>
                <b>Tema de color:</b> {themeLabel(theme)}
              </div>
              <div>
                <b>Posición bloque:</b>{" "}
                {Math.round(blockTop)}px desde arriba · alto{" "}
                {Math.round(blockHeight)}px
              </div>
              <div>
                <b>Tipografía (preview):</b> título {titleSize}px · bajada{" "}
                {subtitleSize}px
              </div>
              <div>
                <b>Fondo:</b> altura {overlayHeightPct}% · opacidad{" "}
                {Math.round(overlayOpacity * 100)}%
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={saving || !previewUrl}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_35px_rgba(56,189,248,0.45)] hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-300"
            >
              {saving ? "Generando cover..." : "Generar / actualizar cover"}
            </button>

            {statusMsg && (
              <div className="rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                {statusMsg}
              </div>
            )}
            {errorMsg && (
              <div className="rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                {errorMsg}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
