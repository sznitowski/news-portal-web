// app/admin/image-editor/page.tsx
"use client";

import { useState, useEffect, ChangeEvent, ClipboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { getBrandUrl } from "@/app/lib/api";

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
type CoverTheme = "purple" | "sunset" | "black";
type AlertAlign = "left" | "center" | "right";

type CoverVariant = "classic" | "full";

// ✅ NUEVO: presets de look (solo editor)
type CoverPreset = "custom" | "classic" | "full" | "institutional" | "breaking";

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

// Paleta
const PALETTE = [
  "#ffffff", // blanco
  "#000000", // negro
  "#7c3aed", // púrpura
  "#f97316", // naranja
  "#ef4444", // rojo
  "#0ea5e9", // azul
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
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Overlay inferior: 0% arriba -> (final) abajo
 * Recomendado: rgba(0,0,0,0) -> rgba(0,0,0,0.60~0.75)
 */
function getBottomOverlay(theme: CoverTheme, opacity: number): string {
  const a = Math.max(0, Math.min(1, opacity));

  switch (theme) {
    case "sunset":
      return `linear-gradient(to bottom,
        rgba(0,0,0,0) 0%,
        rgba(0,0,0,${0.30 * a}) 40%,
        rgba(0,0,0,${0.75 * a}) 100%)`;
    case "purple":
      return `linear-gradient(to bottom,
        rgba(0,0,0,0) 0%,
        rgba(2,6,23,${0.32 * a}) 40%,
        rgba(2,6,23,${0.78 * a}) 100%)`;
    case "black":
    default:
      return `linear-gradient(to bottom,
        rgba(0,0,0,0) 0%,
        rgba(0,0,0,${0.30 * a}) 40%,
        rgba(0,0,0,${0.75 * a}) 100%)`;
  }
}

function themeLabel(value: CoverTheme): string {
  switch (value) {
    case "purple":
      return "Canalibertario (violeta)";
    case "sunset":
      return "Sunset / Urgente (naranja)";
    case "black":
      return "Negro / Luto / Máximo contraste";
    default:
      return value;
  }
}

function alertAlignLabel(value: AlertAlign): string {
  switch (value) {
    case "left":
      return "Izquierda";
    case "center":
      return "Centro";
    case "right":
      return "Derecha";
    default:
      return value;
  }
}

function variantLabel(v: CoverVariant): string {
  return v === "full" ? "Full (más aire + tipografía grande)" : "Clásica";
}

function presetLabel(p: CoverPreset): string {
  switch (p) {
    case "custom":
      return "Custom";
    case "classic":
      return "Preset: Clásica";
    case "full":
      return "Preset: Full";
    case "institutional":
      return "Preset: Institucional (más sutil)";
    case "breaking":
      return "Preset: Breaking (más punch)";
    default:
      return p;
  }
}

// ISO yyyy-mm-dd (para enviar al backend)
function toISODateOnly(input?: string | null): string {
  try {
    if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input; // ya ISO
    const d = input ? new Date(input) : new Date();
    if (Number.isNaN(d.getTime())) {
      const now = new Date();
      return now.toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// mostrar dd/mm/aaaa (AR) desde ISO
function formatDateARFromISO(iso: string): string {
  try {
    const parts = iso.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return new Date().toLocaleDateString("es-AR");
  } catch {
    return new Date().toLocaleDateString("es-AR");
  }
}

function getPillBg(alertTag: string): string {
  if (!alertTag) return "rgba(255,255,255,0.14)";
  if (alertTag === "ÚLTIMA HORA") return "rgba(220,38,38,0.95)"; // #DC2626
  // URGENTE / ALERTA
  return "rgba(55,65,81,0.92)"; // #374151
}

export default function ImageEditorEmbedPage() {
  const searchParams = useSearchParams();

  // ✅ URLs ABSOLUTAS al backend
  const BRAND_LOGO_HORIZONTAL = getBrandUrl("/brand/logo-horizontal.png");
  const BRAND_LOCKUP = getBrandUrl("/brand/canalibertario.png"); // PNG con redes + nombre

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [footer, setFooter] = useState(""); // compat (sitio), no se dibuja como texto
  const [alertTag, setAlertTag] = useState<AlertTag>("");

  const [textPosition, setTextPosition] = useState<TextPosition>("bottom");
  const [textOffsetPct, setTextOffsetPct] = useState(0);

  const [theme, setTheme] = useState<CoverTheme>("black");

  const [titleColor, setTitleColor] = useState("#ffffff");
  const [subtitleColor, setSubtitleColor] = useState("#e5e7eb");
  const [handleColor, setHandleColor] = useState("#ffffff");

  const [alertAlign, setAlertAlign] = useState<AlertAlign>("left");

  // Cabecera tipo "La Derecha Diario"
  const [useHeaderStrip, setUseHeaderStrip] = useState(false);
  const [headerDate, setHeaderDate] = useState("");
  const [headerLabel, setHeaderLabel] = useState("");

  // ✅ overlay recomendado 25–30%
  const [overlayHeight, setOverlayHeight] = useState(30);
  // ✅ CAMBIO: default más sutil (aprox 65% de negro final)
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);

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

  // input para screenshot (texto/URL)
  const [screenshotInput, setScreenshotInput] = useState("");

  // ✅ usar lockup en el footer del preview
  const [useBrandLockup, setUseBrandLockup] = useState(true);

  // ✅ overlay visual de zona segura
  const [showSafeArea, setShowSafeArea] = useState(true);

  // ✅ fecha ISO (yyyy-mm-dd) para enviar al backend
  const [publishDateIso, setPublishDateIso] = useState<string>(() =>
    toISODateOnly(null),
  );

  // ✅ mostrar fecha en preview (opcional)
  const [showFooterDatePreview, setShowFooterDatePreview] = useState(false);

  // ✅ selector de variante de cover (impacta preview + se envía al backend)
  const [coverVariant, setCoverVariant] = useState<CoverVariant>("classic");

  // ✅ tamaños tipográficos (preview + se envía al backend)
  const [titleFontPx, setTitleFontPx] = useState(40);
  const [subtitleFontPx, setSubtitleFontPx] = useState(16);
  const [pillFontPx, setPillFontPx] = useState(12);
  const [footerFontPx, setFooterFontPx] = useState(12);

  // ✅ NUEVO: jerarquía line 2 (más liviana)
  const [line2Opacity, setLine2Opacity] = useState(0.86); // 80–90%
  const [line2Weight, setLine2Weight] = useState(750); // 700–800

  // ✅ NUEVO: footer más sutil (solo preview)
  const [footerOpacity, setFooterOpacity] = useState(0.9);

  // ✅ NUEVO: preset selector (para setear rápido “sensibilidad visual”)
  const [preset, setPreset] = useState<CoverPreset>("custom");

  const publishDateAR = formatDateARFromISO(publishDateIso);

  const applyPreset = (p: CoverPreset) => {
    setPreset(p);

    // No tocamos textos del usuario (title/subtitle), solo look.
    if (p === "classic") {
      setCoverVariant("classic");
      setOverlayHeight(30);
      setOverlayOpacity(0.9);
      setTextOffsetPct(0);
      setPillFontPx(12);
      setTitleFontPx(40);
      setSubtitleFontPx(16);
      setFooterOpacity(0.92);
      setLine2Opacity(0.86);
      setLine2Weight(750);
      return;
    }

    if (p === "full") {
      setCoverVariant("full");
      setOverlayHeight(30);
      setOverlayOpacity(0.9);
      setTextOffsetPct(0);
      setPillFontPx(12);
      setTitleFontPx(44);
      setSubtitleFontPx(17);
      setFooterOpacity(0.92);
      setLine2Opacity(0.86);
      setLine2Weight(750);
      return;
    }

    // Institucional: lo que te marcó el UI expert (menos overlay, pill sutil, bloque un poco más arriba, footer menos protagonista)
    if (p === "institutional") {
      setCoverVariant("classic");
      setOverlayHeight(28);
      setOverlayOpacity(0.85); // ~65% final
      setTextOffsetPct(-4); // sube el bloque levemente
      setPillFontPx(12);
      setTitleFontPx(40);
      setSubtitleFontPx(16);
      setFooterOpacity(0.85);
      setLine2Opacity(0.84);
      setLine2Weight(730);
      return;
    }

    // Breaking: un poquito más agresivo
    if (p === "breaking") {
      setCoverVariant("full");
      setOverlayHeight(32);
      setOverlayOpacity(1);
      setTextOffsetPct(-2);
      setPillFontPx(13);
      setTitleFontPx(46);
      setSubtitleFontPx(18);
      setFooterOpacity(0.9);
      setLine2Opacity(0.88);
      setLine2Weight(780);
      return;
    }

    // custom = no toca nada
  };

  // helper para aplicar File como base
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

  // pegar screenshot desde portapapeles (imagen o URL)
  const handleScreenshotPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      let foundImage = false;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            e.preventDefault();
            const objectUrl = URL.createObjectURL(pastedFile);
            applyBaseFile(pastedFile, objectUrl);
            setScreenshotInput("");
            foundImage = true;
            break;
          }
        }
      }
      if (foundImage) return;
    }

    const text = e.clipboardData.getData("text");
    if (text) {
      e.preventDefault();
      setScreenshotInput(text);
    }
  };

  // cargar captura desde URL pegada
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

  const handleEnhance = async () => {
    if (!file) {
      setErrorMsg(
        "Primero seleccioná una imagen base (subí una, pegá una captura o elegí un RAW de la biblioteca).",
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
        claim: "NOTICIAS Y ANÁLISIS ECONÓMICOS Y POLÍTICOS DESDE UNA MIRADA LIBERTARIA",
        useHeaderWordmark: true,
        siteUrl: safeFooter,
        socialHandle: "@canallibertario",
        socialIcons: ["x", "facebook", "instagram"] as const,
        assets: {
          logoHorizontalPath: BRAND_LOGO_HORIZONTAL,
          lockupPath: BRAND_LOCKUP,
        },
      };

      const footerDateISO = publishDateIso || toISODateOnly(null);

      const optionsJson: any = {
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        footer: safeFooter,
        footerDate: footerDateISO,
        publishDateIso: footerDateISO,
        brand: brandConfig,
        alertTag: alertTag || null,
        useSocialIcons: true,
        layout: {
          textPosition,
          textOffsetPct,
          overlayHeightPct: overlayHeight,
          overlayOpacity,
          headerStrip: useHeaderStrip
            ? {
                date: headerDate.trim() || null,
                label: headerLabel.trim() || null,
              }
            : null,
          alertAlign,
          coverVariant,
          // ✅ opcional para que el backend lo use si querés:
          footerOpacity,
          line2Opacity,
          line2Weight,
        },
        colors: {
          theme,
          bottomBar: "rgba(0,0,0,0.85)",
          title: titleColor,
          subtitle: subtitleColor,
          footer: handleColor,
        },
        typography: {
          titleFontPx,
          subtitleFontPx,
          pillFontPx,
          footerFontPx,
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

      if (data.enhancedImageUrl) {
        setResultUrl(data.enhancedImageUrl);

        const urlLower = data.enhancedImageUrl.toLowerCase();
        const isCover =
          urlLower.includes("/covers/") ||
          urlLower.includes("/cover/") ||
          /[-_/]covers?[-_/]/.test(urlLower);

        setSuccessMsg(
          data.message ??
            (isCover
              ? "Imagen procesada correctamente. Se generó una portada (cover) lista para usar."
              : "Imagen subida como RAW (no se pudo generar cover)."),
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
      publishDate: publishDateIso || "",
      coverVariant,
      titleFontPx: String(titleFontPx),
      subtitleFontPx: String(subtitleFontPx),
      pillFontPx: String(pillFontPx),
      footerFontPx: String(footerFontPx),
      // ✅ NUEVO
      line2Opacity: String(line2Opacity),
      line2Weight: String(line2Weight),
      footerOpacity: String(footerOpacity),
      preset,
    });

    window.open(`/admin/image-editor/full?${q.toString()}`, "_blank");
  };

  const loadImages = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const headers: HeadersInit = { Accept: "application/json" };

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
        throw new Error(text || `Error HTTP ${res.status} al obtener la lista de imágenes`);
      }

      const data = (await res.json()) as { items: ImageItem[] };
      setImages(data.items ?? []);
    } catch (err: any) {
      console.error("[image-editor] Error al cargar imágenes:", err);
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
      searchParams.get("overlaySubtitle") ?? searchParams.get("subtitle") ?? "";
    const overlayFooter =
      searchParams.get("overlayFooter") ?? searchParams.get("footer") ?? "";

    const overlayPrimaryColor =
      searchParams.get("overlayPrimaryColor") ?? searchParams.get("primaryColor") ?? "";
    const overlaySecondaryColor =
      searchParams.get("overlaySecondaryColor") ??
      searchParams.get("secondaryColor") ??
      "";
    const overlayTone = searchParams.get("overlayTone") ?? searchParams.get("tone") ?? "";

    const qpTextPos = searchParams.get("textPosition");
    if (qpTextPos === "top" || qpTextPos === "middle" || qpTextPos === "bottom") {
      setTextPosition(qpTextPos);
    }

    const qpVariant = searchParams.get("coverVariant");
    if (qpVariant === "classic" || qpVariant === "full") setCoverVariant(qpVariant);

    const qpTitleFont = Number(searchParams.get("titleFontPx"));
    if (!Number.isNaN(qpTitleFont) && qpTitleFont >= 28 && qpTitleFont <= 60) {
      setTitleFontPx(qpTitleFont);
    }
    const qpSubFont = Number(searchParams.get("subtitleFontPx"));
    if (!Number.isNaN(qpSubFont) && qpSubFont >= 12 && qpSubFont <= 26) {
      setSubtitleFontPx(qpSubFont);
    }
    const qpPillFont = Number(searchParams.get("pillFontPx"));
    if (!Number.isNaN(qpPillFont) && qpPillFont >= 10 && qpPillFont <= 16) {
      setPillFontPx(qpPillFont);
    }
    const qpFooterFont = Number(searchParams.get("footerFontPx"));
    if (!Number.isNaN(qpFooterFont) && qpFooterFont >= 10 && qpFooterFont <= 16) {
      setFooterFontPx(qpFooterFont);
    }

    // ✅ NUEVO
    const qpLine2Opacity = Number(searchParams.get("line2Opacity"));
    if (!Number.isNaN(qpLine2Opacity) && qpLine2Opacity >= 0.7 && qpLine2Opacity <= 1) {
      setLine2Opacity(qpLine2Opacity);
    }
    const qpLine2Weight = Number(searchParams.get("line2Weight"));
    if (!Number.isNaN(qpLine2Weight) && qpLine2Weight >= 600 && qpLine2Weight <= 900) {
      setLine2Weight(qpLine2Weight);
    }
    const qpFooterOpacity = Number(searchParams.get("footerOpacity"));
    if (!Number.isNaN(qpFooterOpacity) && qpFooterOpacity >= 0.6 && qpFooterOpacity <= 1) {
      setFooterOpacity(qpFooterOpacity);
    }
    const qpPreset = searchParams.get("preset") as CoverPreset | null;
    if (qpPreset) setPreset(qpPreset);

    // publishDate desde query -> ISO
    const qpPublishDate = searchParams.get("publishDate") ?? searchParams.get("publishedAt");
    if (qpPublishDate) setPublishDateIso(toISODateOnly(qpPublishDate));
    else setPublishDateIso(toISODateOnly(null));

    if (overlayTitle) setTitle(overlayTitle);
    if (overlaySubtitle) setSubtitle(overlaySubtitle);
    if (overlayFooter) setFooter(overlayFooter);

    if (overlayPrimaryColor) setTitleColor(overlayPrimaryColor);
    if (overlaySecondaryColor) {
      setSubtitleColor(overlaySecondaryColor);
      setHandleColor(overlaySecondaryColor);
    }

    if (overlayTone === "light") setOverlayOpacity(0.85);
    else if (overlayTone === "dark") setOverlayOpacity(1);

    if (imageUrl) {
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
      if (!res.ok) throw new Error("No se pudo descargar la imagen seleccionada.");

      const blob = await res.blob();
      const mime = blob.type || "image/jpeg";

      let ext = "jpg";
      if (mime === "image/png") ext = "png";
      else if (mime === "image/webp") ext = "webp";

      const name = img.filename || `image-from-library.${ext}`;
      const f = new File([blob], name, { type: mime });

      applyBaseFile(f, img.url);

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
      !searchTerm || img.filename.toLowerCase().includes(searchTerm.toLowerCase());

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

  // Vista previa SIEMPRE en base a la imagen base (editor)
  const mainPreviewUrl = previewUrl;
  const hasBaseImage = !!mainPreviewUrl;

  const alertAlignClass =
    alertAlign === "left"
      ? "justify-start"
      : alertAlign === "center"
        ? "justify-center"
        : "justify-end";

  const displayTitle = title || "Título de la portada";
  const titleLines = displayTitle.split(/\r?\n/).slice(0, 3);

  // Safe area (1280×720): 64px lateral (~5%), 72px abajo (~10%)
  const SAFE_X = "5%";
  const SAFE_TOP = "6.5%";
  const SAFE_BOTTOM = "10%";

  const textVertical =
    textPosition === "top"
      ? "justify-start"
      : textPosition === "middle"
        ? "justify-center"
        : "justify-end";

  // ✅ Ajustes por variante (solo preview)
  const variantPaddingX = coverVariant === "full" ? 44 : 32;
  const variantPaddingY = coverVariant === "full" ? 22 : 18;
  const variantMaxWidth = coverVariant === "full" ? 940 : 860;
  const variantTitleShadow =
    coverVariant === "full"
      ? "0 12px 30px rgba(0,0,0,0.38)"
      : "0 10px 26px rgba(0,0,0,0.35)";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-900/80 bg-slate-950/95 text-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.95)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),transparent_60%)] opacity-80" />

        <section className="relative z-10 space-y-6 p-4 md:p-8">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Editor de imágenes · Covers
            </div>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
              Ajustá textos y vista previa antes de generar la cover
            </h1>
            <p className="max-w-3xl text-sm text-slate-300">
              Subí una imagen, pegá una captura o elegí una RAW de la biblioteca. Después definí el
              título, la bajada y la etiqueta. La salida es una cover horizontal 1280×720.
            </p>
          </header>

          {/* Preview / Resultado */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Vista previa (editor) / Resultado (renderer)
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                  onClick={handleEnhance}
                  disabled={loading || !file}
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_35px_rgba(56,189,248,0.45)] hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-300"
                >
                  {loading ? "Procesando..." : "Generar cover (renderer)"}
                </button>

                <button
                  type="button"
                  onClick={handleOpenFullEditor}
                  disabled={!previewUrl && !resultUrl}
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-sky-400 hover:bg-slate-800 disabled:opacity-50"
                >
                  Full
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-12">
              {/* PREVIEW */}
              <div className="xl:col-span-8 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Vista previa
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-[11px] text-slate-200">
                      <input
                        type="checkbox"
                        checked={showFooterDatePreview}
                        onChange={(e) => setShowFooterDatePreview(e.target.checked)}
                        className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                      />
                      Mostrar fecha en preview
                    </label>

                    {/* ✅ NUEVO: selector de preset */}
                    <select
                      value={preset}
                      onChange={(e) => applyPreset(e.target.value as CoverPreset)}
                      className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-[11px] text-slate-100 outline-none"
                      title="Preset de look (solo preview + se envía al backend)"
                    >
                      <option value="custom">{presetLabel("custom")}</option>
                      <option value="classic">{presetLabel("classic")}</option>
                      <option value="full">{presetLabel("full")}</option>
                      <option value="institutional">{presetLabel("institutional")}</option>
                      <option value="breaking">{presetLabel("breaking")}</option>
                    </select>

                    {/* selector de variante */}
                    <select
                      value={coverVariant}
                      onChange={(e) => {
                        setPreset("custom");
                        setCoverVariant(e.target.value as CoverVariant);
                      }}
                      className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-[11px] text-slate-100 outline-none"
                      title="Variante de cover"
                    >
                      <option value="classic">{variantLabel("classic")}</option>
                      <option value="full">{variantLabel("full")}</option>
                    </select>
                  </div>
                </div>

                {hasBaseImage ? (
                  <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                    <div className="relative aspect-video w-full">
                      {mainPreviewUrl && (
                        <img
                          src={mainPreviewUrl}
                          alt="Preview portada"
                          className="h-full w-full object-cover"
                          onClick={() => window.open(mainPreviewUrl, "_blank")}
                          style={{ cursor: "zoom-in" }}
                        />
                      )}

                      {/* Safe area overlay */}
                      {showSafeArea && (
                        <>
                          <div
                            className="pointer-events-none absolute z-30 rounded-xl border border-white/20"
                            style={{
                              left: SAFE_X,
                              right: SAFE_X,
                              top: SAFE_TOP,
                              bottom: SAFE_BOTTOM,
                              boxShadow: "0 0 0 9999px rgba(0,0,0,0.06) inset",
                            }}
                          />
                          <div
                            className="pointer-events-none absolute z-30 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70"
                            style={{ left: SAFE_X, bottom: SAFE_BOTTOM }}
                          >
                            safe area
                          </div>
                        </>
                      )}

                      {/* Header strip (opcional) */}
                      {useHeaderStrip && (
                        <div
                          className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-4 px-6 py-2.5"
                          style={{
                            background:
                              "linear-gradient(to right, rgba(15,23,42,0.92), rgba(15,23,42,0.78))",
                          }}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <img
                              src={BRAND_LOGO_HORIZONTAL}
                              alt="Canalibertario"
                              className="h-5 w-auto opacity-95"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                                {headerDate || "Fecha no definida"}
                              </div>
                              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                                {headerLabel || "Cobertura especial"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Overlay inferior */}
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
                        style={{
                          height: `${overlayHeight}%`,
                          background: getBottomOverlay(theme, overlayOpacity),
                          transform:
                            textOffsetPct !== 0 ? `translateY(${textOffsetPct}%)` : undefined,
                        }}
                      >
                        <div
                          className={`flex h-full w-full flex-col ${textVertical}`}
                          style={{
                            paddingLeft: `${variantPaddingX}px`,
                            paddingRight: `${variantPaddingX}px`,
                            paddingBottom: `${variantPaddingY}px`,
                            paddingTop: `${variantPaddingY}px`,
                          }}
                        >
                          <div className="space-y-3">
                            {/* Pill */}
                            {alertTag && (
                              <div className={`flex ${alertAlignClass}`}>
                                <div
                                  className="inline-flex items-center rounded-full px-3 py-1 font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_22px_rgba(0,0,0,0.25)]"
                                  style={{ background: getPillBg(alertTag), fontSize: pillFontPx }}
                                >
                                  {alertTag}
                                </div>
                              </div>
                            )}

                            {/* Headline (2 líneas con jerarquía) */}
                            <div
                              className="leading-[1.08] tracking-[0.02em]"
                              style={{
                                maxWidth: `${variantMaxWidth}px`,
                                color: titleColor,
                                textShadow: variantTitleShadow,
                              }}
                            >
                              {/* Línea 1 */}
                              <div
                                className="font-extrabold"
                                style={{ fontSize: titleFontPx, opacity: 1 }}
                              >
                                {titleLines[0] ?? ""}
                              </div>

                              {/* Línea 2 (más liviana) */}
                              {titleLines[1] ? (
                                <div
                                  style={{
                                    fontSize: Math.max(24, Math.round(titleFontPx * 0.86)),
                                    fontWeight: line2Weight,
                                    opacity: line2Opacity,
                                  }}
                                >
                                  {titleLines[1]}
                                </div>
                              ) : null}

                              {/* Línea 3 (si existe) */}
                              {titleLines[2] ? (
                                <div
                                  style={{
                                    fontSize: Math.max(22, Math.round(titleFontPx * 0.78)),
                                    fontWeight: Math.max(650, Math.round(line2Weight - 50)),
                                    opacity: Math.max(0.78, line2Opacity - 0.06),
                                  }}
                                >
                                  {titleLines[2]}
                                </div>
                              ) : null}
                            </div>

                            {/* Subtitle */}
                            {subtitle && (
                              <div
                                className="font-medium leading-snug"
                                style={{
                                  maxWidth: `${variantMaxWidth}px`,
                                  color: subtitleColor,
                                  textShadow: "0 8px 22px rgba(0,0,0,0.28)",
                                  fontSize: subtitleFontPx,
                                }}
                              >
                                {subtitle}
                              </div>
                            )}

                            {/* Footer: lockup izq + fecha der */}
                            <div className="mt-2 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                {useBrandLockup ? (
                                  <img
                                    src={BRAND_LOCKUP}
                                    alt="Canalibertario redes"
                                    className="h-7 w-auto"
                                    style={{ opacity: footerOpacity }}
                                  />
                                ) : (
                                  <img
                                    src={BRAND_LOGO_HORIZONTAL}
                                    alt="Canalibertario"
                                    className="h-6 w-auto"
                                    style={{ opacity: footerOpacity }}
                                  />
                                )}
                              </div>

                              {showFooterDatePreview ? (
                                <span
                                  className="font-semibold uppercase tracking-[0.18em]"
                                  style={{
                                    color: handleColor,
                                    textShadow: "0 8px 22px rgba(0,0,0,0.28)",
                                    fontSize: footerFontPx,
                                    opacity: footerOpacity,
                                  }}
                                >
                                  {publishDateAR}
                                </span>
                              ) : (
                                <span />
                              )}
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

          {/* CONTROLES */}
          <div className="grid gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 md:grid-cols-12 md:p-6">
            <div className="md:col-span-5 space-y-4">
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
                  placeholder="Ctrl+V para pegar la imagen o pegá la URL de la captura..."
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-400">
                    Si pegás una imagen se usa como RAW. Si pegás una URL, clic en &quot;Usar
                    captura&quot;.
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

              <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Textos
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Título principal</label>
                  <textarea
                    rows={2}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    placeholder="Ej: Milei anuncia medidas"
                  />
                  <p className="text-[10px] text-slate-400">
                    Podés usar <strong>Enter</strong> para forzar saltos de línea.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Bajada / descripción corta</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    placeholder="Ej: Nuevo plan económico"
                  />
                </div>

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
                  <label className="text-[11px] text-slate-300">Posición de la etiqueta</label>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {(["left", "center", "right"] as AlertAlign[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAlertAlign(a)}
                        className={`rounded-full border px-3 py-1 font-semibold ${
                          alertAlign === a
                            ? "border-sky-400 bg-sky-500/10 text-sky-200"
                            : "border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400 hover:bg-slate-800"
                        }`}
                      >
                        {alertAlignLabel(a)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-800/70 bg-slate-900/60 p-2">
                  <label className="flex items-center gap-2 text-[11px] text-slate-200">
                    <input
                      type="checkbox"
                      checked={useHeaderStrip}
                      onChange={(e) => setUseHeaderStrip(e.target.checked)}
                      className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                    />
                    Mostrar franja superior (fecha / contexto + logo horizontal)
                  </label>

                  {useHeaderStrip && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300">Fecha / momento</label>
                        <input
                          type="text"
                          value={headerDate}
                          onChange={(e) => setHeaderDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                          placeholder="Ej: 20/12/2025 · 20:17"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300">Texto extra (opcional)</label>
                        <input
                          type="text"
                          value={headerLabel}
                          onChange={(e) => setHeaderLabel(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                          placeholder="Ej: Cobertura especial · Economía"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Fecha de publicación</label>
                  <input
                    type="date"
                    value={publishDateIso}
                    onChange={(e) => setPublishDateIso(toISODateOnly(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    En preview se ve como <strong>{publishDateAR}</strong> si activás el toggle.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Sitio del canal</label>
                  <input
                    type="text"
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    placeholder="www.canalibertario.com (opcional)"
                  />
                </div>

                <label className="flex items-center gap-2 text-[11px] text-slate-200">
                  <input
                    type="checkbox"
                    checked={useBrandLockup}
                    onChange={(e) => setUseBrandLockup(e.target.checked)}
                    className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                  />
                  Usar lockup (redes + Canalibertario) en el footer
                </label>
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Layout, variante y tipografía
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Variante de cover</label>
                  <select
                    value={coverVariant}
                    onChange={(e) => {
                      setPreset("custom");
                      setCoverVariant(e.target.value as CoverVariant);
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                  >
                    <option value="classic">{variantLabel("classic")}</option>
                    <option value="full">{variantLabel("full")}</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Afecta la vista previa (paddings, ancho, sombras). Se envía al backend por si
                    querés replicarlo ahí.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Posición del bloque de texto</label>
                  <select
                    value={textPosition}
                    onChange={(e) => setTextPosition(e.target.value as TextPosition)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                  >
                    <option value="bottom">Inferior (clásico)</option>
                    <option value="middle">Centro</option>
                    <option value="top">Superior</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Ajuste fino vertical</label>
                  <input
                    type="range"
                    min={-20}
                    max={20}
                    value={textOffsetPct}
                    onChange={(e) => {
                      setPreset("custom");
                      setTextOffsetPct(Number(e.target.value) || 0);
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">
                    {textOffsetPct}% (negativo sube, positivo baja).
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Tema de color del overlay</label>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {(["purple", "sunset", "black"] as CoverTheme[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setPreset("custom");
                          setTheme(t);
                        }}
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

              {/* Overlay */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Altura del overlay</label>
                  <input
                    type="range"
                    min={25}
                    max={40}
                    value={overlayHeight}
                    onChange={(e) => {
                      setPreset("custom");
                      setOverlayHeight(Number(e.target.value) || 30);
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">{overlayHeight}%</div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Intensidad del overlay</label>
                  <input
                    type="range"
                    min={60}
                    max={100}
                    value={Math.round(overlayOpacity * 100)}
                    onChange={(e) => {
                      setPreset("custom");
                      setOverlayOpacity(
                        Math.max(0.6, Math.min(1, Number(e.target.value) / 100)),
                      );
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">
                    {Math.round(overlayOpacity * 100)}%
                  </div>
                </div>
              </div>

              {/* Tipografía */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Tamaño título (línea 1)</label>
                  <input
                    type="range"
                    min={28}
                    max={60}
                    value={titleFontPx}
                    onChange={(e) => {
                      setPreset("custom");
                      setTitleFontPx(Number(e.target.value) || 40);
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">{titleFontPx}px</div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Tamaño bajada</label>
                  <input
                    type="range"
                    min={12}
                    max={26}
                    value={subtitleFontPx}
                    onChange={(e) => {
                      setPreset("custom");
                      setSubtitleFontPx(Number(e.target.value) || 16);
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">{subtitleFontPx}px</div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Tamaño pill</label>
                  <input
                    type="range"
                    min={10}
                    max={16}
                    value={pillFontPx}
                    onChange={(e) => {
                      setPreset("custom");
                      setPillFontPx(Number(e.target.value) || 12);
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">{pillFontPx}px</div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Tamaño footer (preview)</label>
                  <input
                    type="range"
                    min={10}
                    max={16}
                    value={footerFontPx}
                    onChange={(e) => {
                      setPreset("custom");
                      setFooterFontPx(Number(e.target.value) || 12);
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">{footerFontPx}px</div>
                </div>
              </div>

              {/* Jerarquía línea 2 + footer sutil */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Línea 2 · Opacidad</label>
                  <input
                    type="range"
                    min={70}
                    max={100}
                    value={Math.round(line2Opacity * 100)}
                    onChange={(e) => {
                      setPreset("custom");
                      setLine2Opacity(Math.max(0.7, Math.min(1, Number(e.target.value) / 100)));
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">{Math.round(line2Opacity * 100)}%</div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Línea 2 · Weight</label>
                  <input
                    type="range"
                    min={600}
                    max={900}
                    step={10}
                    value={line2Weight}
                    onChange={(e) => {
                      setPreset("custom");
                      setLine2Weight(Number(e.target.value) || 750);
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">{line2Weight}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">Footer · Opacidad</label>
                  <input
                    type="range"
                    min={70}
                    max={100}
                    value={Math.round(footerOpacity * 100)}
                    onChange={(e) => {
                      setPreset("custom");
                      setFooterOpacity(Math.max(0.7, Math.min(1, Number(e.target.value) / 100)));
                    }}
                    className="w-full"
                  />
                  <div className="text-[10px] text-slate-400">{Math.round(footerOpacity * 100)}%</div>
                </div>
              </div>

              {/* Colores */}
              <div className="grid gap-3 md:grid-cols-3">
                <ColorSwatches label="Color título" value={titleColor} onChange={setTitleColor} />
                <ColorSwatches
                  label="Color bajada"
                  value={subtitleColor}
                  onChange={setSubtitleColor}
                />
                <ColorSwatches label="Color fecha" value={handleColor} onChange={setHandleColor} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* BIBLIOTECA */}
      <section className="mt-6 rounded-3xl border border-slate-900/80 bg-slate-950/95 p-4 text-slate-50">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Biblioteca de imágenes</h2>
            <p className="text-xs text-slate-400">RAW + covers generadas automáticamente.</p>
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
      </section>
    </main>
  );
}
