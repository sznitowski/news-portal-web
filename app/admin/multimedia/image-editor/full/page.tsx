"use client";

import {
  useState,
  useEffect,
  useRef,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useSearchParams } from "next/navigation";

type TextPosition = "top" | "middle" | "bottom";
type CoverTheme = "purple" | "blue" | "red" | "wine" | "black" | "sunset";

const ALERT_TAGS = ["", "URGENTE", "ALERTA", "ÚLTIMA HORA"] as const;
type AlertTag = (typeof ALERT_TAGS)[number];

type DragTarget =
  | "block"
  | "title"
  | "subtitle"
  | "resize"
  | "alert"
  | "logoCircle"
  | "logoHorizontal"
  | "logoCircleResize"
  | "logoHorizontalResize"
  | null;

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

  // logo
  logoCircleXPct: number;
  logoCircleYPct: number;
  logoCircleWidthPct: number;

  logoHorizontalXPct: number;
  logoHorizontalYPct: number;
  logoHorizontalWidthPct: number;
} | null;

const BASE_COLORS = [
  "#ffffff",
  "#000000",
  "#6d28d9",
  "#f97316",
  "#ef4444",
  "#0ea5e9",
] as const;

const TITLE_COLORS = [...BASE_COLORS];
const SUBTITLE_COLORS = [...BASE_COLORS];
const BRAND_COLORS = [...BASE_COLORS];

const DEFAULT_BLOCK_HEIGHT = 130;

// baseline 16:9 (720p)
const FOOTER_HEIGHT = 54;
const HEADER_STRIP_HEIGHT = 40;

const PREVIEW_HEIGHT_FALLBACK = 360;

// ✅ footer lockup (FIJO / NO TOCAR)
const BRAND_LOCKUP_SRC = "/brand/canalibertario.png";

// ✅ logos flotantes (overlay) — probamos varias rutas porque en prod linux el case importa
const LOGO_CIRCLE_CANDIDATES = [
  "/brand/Logos/logo-circular.png",
  "/brand/logos/logo-circular.png",
  "/brand/logo-circular.png",
  "/brand/logo-circular.webp",
  "/brand/logo-circular.svg",

  // ✅ fallback: si no existe el circular, al menos mostrás ALGO real
  "/brand/canalibertario.png",
];


const LOGO_HORIZONTAL_CANDIDATES = [
  "/brand/Logos/logo-horizontal.png",
  "/brand/logos/logo-horizontal.png",
  "/brand/logo-horizontal.png",
  "/brand/logo-horizontal.webp",
  "/brand/logo-horizontal.svg",

  // ✅ fallback: si no existe el horizontal, mostrás el lockup
  "/brand/canalibertario.png",
];

// Iconos (si los usás en el footer lockup visual del editor)
const ICON_X = "/brand/icon-twitter.png";
const ICON_FB = "/brand/icon-facebook.png";
const ICON_IG = "/brand/icon-instagram.png";

function themeLabel(value: CoverTheme): string {
  switch (value) {
    case "purple":
      return "Canalibertario (violeta)";
    case "blue":
      return "Azul / Institucional";
    case "red":
      return "Rojo / Impacto";
    case "wine":
      return "Wine (legacy) → Rojo / Impacto";
    case "black":
      return "Negro / Máximo contraste";
    case "sunset":
      return "Sunset (legacy)";
    default:
      return value;
  }
}

function getThemePreviewColors(theme: CoverTheme) {
  const t: CoverTheme = theme === "wine" ? "red" : theme;

  switch (t) {
    case "purple":
      return {
        bandFrom: "rgba(10,6,20,0.00)",
        bandMid: "rgba(0,0,0,0.28)",
        bandTo: "rgba(58,28,107,0.78)",
        footerBg: "#160A2E",
        footerBorder: "rgba(58,28,107,0.20)",
      };
    case "blue":
      return {
        bandFrom: "rgba(5,11,22,0.00)",
        bandMid: "rgba(0,0,0,0.28)",
        bandTo: "rgba(15,76,129,0.78)",
        footerBg: "#071A2D",
        footerBorder: "rgba(15,76,129,0.20)",
      };
    case "red":
      return {
        bandFrom: "rgba(11,7,16,0.00)",
        bandMid: "rgba(0,0,0,0.28)",
        bandTo: "rgba(177,18,38,0.78)",
        footerBg: "#3B0A0A",
        footerBorder: "rgba(177,18,38,0.20)",
      };
    case "black":
      return {
        bandFrom: "rgba(0,0,0,0.00)",
        bandMid: "rgba(0,0,0,0.35)",
        bandTo: "rgba(0,0,0,0.85)",
        footerBg: "#05070d",
        footerBorder: "rgba(100,116,139,0.20)",
      };
    case "sunset":
    default:
      return {
        bandFrom: "rgba(2,6,23,0.00)",
        bandMid: "rgba(0,0,0,0.28)",
        bandTo: "rgba(217,119,6,0.78)",
        footerBg: "#120A05",
        footerBorder: "rgba(217,119,6,0.20)",
      };
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function isUrlLike(s: string) {
  const t = (s ?? "").toLowerCase();
  return t.includes("http://") || t.includes("https://") || t.includes("www.");
}

function normalizeTheme(input: string | null): CoverTheme | null {
  if (!input) return null;
  const t = input as CoverTheme;
  if (t === "wine") return "red";
  if (t === "purple" || t === "blue" || t === "red" || t === "black") return t;
  if (t === "sunset") return "sunset";
  return null;
}

// Preview bars escalados (coincide backend)
function getScaledBarsForPreview(args: {
  previewH: number;
  showHeaderStrip: boolean;
}) {
  const h = Math.max(1, args.previewH);

  const footerH = Math.round((FOOTER_HEIGHT / 720) * h);
  const headerH = args.showHeaderStrip
    ? Math.round((HEADER_STRIP_HEIGHT / 720) * h)
    : 0;

  const contentTopOffset = headerH;
  const contentHeight = Math.max(1, h - footerH - headerH);

  return { footerH, headerH, contentTopOffset, contentHeight };
}

// ✅ Conversión CORRECTA: blockTopPct/overlayHeightPct como % de contentHeight
function getBackendLayoutPct(args: {
  previewEl: HTMLDivElement | null;
  previewHeightFallback: number;

  showHeaderStrip: boolean;
  headerStripHeightPx: number;
  footerHeightPx: number;

  blockTopPx: number;
  blockHeightPx: number;
}) {
  const liveH =
    args.previewEl?.getBoundingClientRect().height &&
      args.previewEl.getBoundingClientRect().height > 0
      ? args.previewEl.getBoundingClientRect().height
      : args.previewHeightFallback;

  const headerH = args.showHeaderStrip ? args.headerStripHeightPx : 0;
  const contentH = Math.max(1, liveH - args.footerHeightPx - headerH);

  const topInsideContentPx = args.blockTopPx - headerH;

  const blockTopPct = clamp((topInsideContentPx / contentH) * 100, 0, 100);
  const overlayHeightPct = clamp((args.blockHeightPx / contentH) * 100, 0, 100);

  return { blockTopPct, overlayHeightPct, liveH, contentH, headerH };
}

function pxToPct(px: number, size: number) {
  return clamp((px / Math.max(1, size)) * 100, 0, 100);
}
function pctToPx(pct: number, size: number) {
  return (clamp(pct, 0, 100) / 100) * Math.max(1, size);
}

/**
 * ✅ El backend interpreta logoOverlay.xPct/yPct como % del canvas completo (width/height),
 * pero el editor guarda Y como % del "content box".
 * Convierte Y content->canvas usando baseline 720.
 */
function contentYPctToCanvasYPct(args: {
  yContentPct: number;
  showHeaderStrip: boolean;
}) {
  const headerH = args.showHeaderStrip ? HEADER_STRIP_HEIGHT : 0;
  const footerH = FOOTER_HEIGHT;
  const contentH = 720 - headerH - footerH;

  const yPxInCanvas =
    headerH + (clamp(args.yContentPct, 0, 100) / 100) * contentH;
  return (yPxInCanvas / 720) * 100;
}

// ✅ Img que intenta múltiples paths. Si falla todo, muestra placeholder (NO desaparece).
function ImgMulti(props: {
  candidates: string[];
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onMouseDown?: (e: ReactMouseEvent<HTMLElement>) => void;
  rounded?: boolean;
}) {
  const { candidates, alt, className, style, onMouseDown, rounded } = props;
  const [idx, setIdx] = useState(0);
  const src = candidates[idx] ?? "";

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIdx(0);
    setFailed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.join("|")]);

  if (failed || !src) {
    return (
      <div
        onMouseDown={onMouseDown}
        className={`flex items-center justify-center border border-white/20 bg-black/40 text-[10px] text-white/70 ${rounded ? "rounded-full" : "rounded-xl"
          } ${className ?? ""}`}
        style={style}
        title={`No se encontró asset: ${candidates.join(" | ")}`}
      >
        LOGO (ruta mal)
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={onMouseDown}
      onError={() => {
        const next = idx + 1;
        if (next < candidates.length) setIdx(next);
        else setFailed(true);
      }}
    />
  );
}

export default function ImageEditorFullPage() {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const [previewHeight, setPreviewHeight] = useState(PREVIEW_HEIGHT_FALLBACK);

  // Imagen base
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ✅ branding
  const [showLogoCircle, setShowLogoCircle] = useState(true);
  const [showLogoHorizontal, setShowLogoHorizontal] = useState(false);

  // ⚠️ footer lockup SIEMPRE activo (fijo / NO se toca)
  const showFooterLockup = true;

  // ✅ logo overlay: posición/size (en % del CONTENT BOX)
  // (X/Y internos para drag, NO hay sliders X/Y)
  const [logoCircleXPct, setLogoCircleXPct] = useState(82);
  const [logoCircleYPct, setLogoCircleYPct] = useState(10);
  const [logoCircleWidthPct, setLogoCircleWidthPct] = useState(10);
  const [logoCircleOpacity, setLogoCircleOpacity] = useState(0.95);

  const [logoHorizontalXPct, setLogoHorizontalXPct] = useState(70);
  const [logoHorizontalYPct, setLogoHorizontalYPct] = useState(10);
  const [logoHorizontalWidthPct, setLogoHorizontalWidthPct] = useState(24);
  const [logoHorizontalOpacity, setLogoHorizontalOpacity] = useState(0.95);

  // Textos
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [footer, setFooter] = useState("");
  const [alertTag, setAlertTag] = useState<AlertTag>("");

  // Header strip
  const [showHeaderStrip, setShowHeaderStrip] = useState(false);
  const [headerDate, setHeaderDate] = useState("");
  const [headerLabel, setHeaderLabel] = useState("");

  // Colores
  const [titleColor, setTitleColor] = useState("#ffffff");
  const [subtitleColor, setSubtitleColor] = useState("#e5e7eb");
  const [brandColor, setBrandColor] = useState("#ffffff");

  // Tema
  const [theme, setTheme] = useState<CoverTheme>("black");

  // Tamaños textos
  const [titleSize, setTitleSize] = useState(24);
  const [subtitleSize, setSubtitleSize] = useState(20);

  // Bloque
  const [blockTop, setBlockTop] = useState(260);
  const [blockHeight, setBlockHeight] = useState(DEFAULT_BLOCK_HEIGHT);
  const [initialBlockTop, setInitialBlockTop] = useState(260);
  const [textPosition, setTextPosition] = useState<TextPosition>("bottom");

  const [overlayOpacity, setOverlayOpacity] = useState(1);

  // Offsets dentro del bloque
  const [titleOffsetX, setTitleOffsetX] = useState(40);
  const [titleOffsetY, setTitleOffsetY] = useState(30);
  const [subtitleOffsetX, setSubtitleOffsetX] = useState(40);
  const [subtitleOffsetY, setSubtitleOffsetY] = useState(80);

  // Tag offsets
  const [alertOffsetX, setAlertOffsetX] = useState(40);
  const [alertOffsetY, setAlertOffsetY] = useState(10);

  // Drag
  const [drag, setDrag] = useState<DragState>(null);

  // Estado
  const [loadingImage, setLoadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Previews redes
  const [showSocialPreviews, setShowSocialPreviews] = useState(true);

  const themeColors = getThemePreviewColors(theme);

  // ✅ mutual exclusive
  useEffect(() => {
    if (showLogoHorizontal && showLogoCircle) setShowLogoCircle(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLogoHorizontal]);
  useEffect(() => {
    if (showLogoCircle && showLogoHorizontal) setShowLogoHorizontal(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLogoCircle]);

  // medir altura real preview
  useEffect(() => {
    function updateHeight() {
      if (!previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      if (rect.height > 0) setPreviewHeight(rect.height);
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [previewUrl, showHeaderStrip]);

  // INIT desde querystring
  useEffect(() => {
    const imageUrl = searchParams.get("imageUrl");
    const initialTitle = searchParams.get("title") ?? "";
    const initialSubtitle = searchParams.get("subtitle") ?? "";

    const initialFooterRaw = (searchParams.get("footer") ?? "").trim();
    const initialFooter = isUrlLike(initialFooterRaw) ? "" : initialFooterRaw;

    const initialAlert =
      (searchParams.get("alertTag") as AlertTag | null) ?? "";
    const qpTheme = normalizeTheme(searchParams.get("theme"));

    const qpHeaderEnabled = searchParams.get("headerEnabled") === "1";
    const qpHeaderDate = searchParams.get("headerDate") ?? "";
    const qpHeaderLabel = searchParams.get("headerLabel") ?? "";

    setTitle(initialTitle);
    setSubtitle(initialSubtitle);
    setFooter(initialFooter);
    setAlertTag(initialAlert);

    setShowHeaderStrip(qpHeaderEnabled);
    setHeaderDate(qpHeaderDate);
    setHeaderLabel(qpHeaderLabel);

    if (qpTheme) setTheme(qpTheme);

    const textPosParam = searchParams.get("textPosition") as
      | TextPosition
      | null;

    let pos: TextPosition = "bottom";
    let startTop = 260;

    if (textPosParam === "top") {
      pos = "top";
      startTop = 90;
    } else if (textPosParam === "middle") {
      pos = "middle";
      startTop = 170;
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

        const f = new File([blob], `image-from-url.jpg`, { type: mime });
        setFile(f);
        setPreviewUrl(imageUrl);
      } catch (err: any) {
        console.error("[editor-full] error al cargar imagen inicial:", err);
        setPreviewUrl(imageUrl);
        setFile(null);
      } finally {
        setLoadingImage(false);
      }
    })();
  }, [searchParams]);

  // IMAGEN LOCAL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setErrorMsg(null);
    setStatusMsg(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  // Área útil (content box)
  const effectiveHeight = previewHeight || PREVIEW_HEIGHT_FALLBACK;
  const bars = getScaledBarsForPreview({
    previewH: effectiveHeight,
    showHeaderStrip,
  });

  const contentTopOffset = bars.contentTopOffset;
  const contentHeight = bars.contentHeight;
  const previewHeaderH = bars.headerH;
  const previewFooterH = bars.footerH;

  function getPreviewSizes() {
    const previewW =
      previewRef.current?.getBoundingClientRect().width ?? 1280;
    const previewH =
      previewRef.current?.getBoundingClientRect().height ?? 720;

    const contentW = Math.max(1, previewW);
    const contentH = Math.max(1, previewH - previewHeaderH - previewFooterH);

    return { previewW, previewH, contentW, contentH };
  }

  // clamp de logo dentro del content box (0..contentW-logoW, 0..contentH-logoH)
  function clampLogoPct(args: {
    xPct: number;
    yPct: number;
    widthPct: number;
    kind: "circle" | "horizontal";
  }) {
    const { contentW, contentH } = getPreviewSizes();
    const wPx = (args.widthPct / 100) * contentW;

    // altura estimada para hitbox / clamp
    const hPx = args.kind === "circle" ? wPx : wPx * 0.28;

    const xPx = pctToPx(args.xPct, contentW);
    const yPx = pctToPx(args.yPct, contentH);

    const maxX = Math.max(0, contentW - wPx);
    const maxY = Math.max(0, contentH - hPx);

    const xClamped = clamp(xPx, 0, maxX);
    const yClamped = clamp(yPx, 0, maxY);

    return {
      xPct: pxToPct(xClamped, contentW),
      yPct: pxToPct(yClamped, contentH),
    };
  }

  // DRAG start
  const startDrag = (target: DragTarget, e: ReactMouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

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

      logoCircleXPct,
      logoCircleYPct,
      logoCircleWidthPct,

      logoHorizontalXPct,
      logoHorizontalYPct,
      logoHorizontalWidthPct,
    });
  };

  // DRAG move
  useEffect(() => {
    if (!drag) return;

    const handleMove = (ev: MouseEvent) => {
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;

      switch (drag.target) {
        case "block": {
          const minTop = contentTopOffset + 12;
          const maxTop = contentTopOffset + contentHeight - drag.blockHeight;
          const newTop = drag.blockTop + dy;
          setBlockTop(Math.min(maxTop, Math.max(minTop, newTop)));
          break;
        }
        case "resize": {
          const minHeight = 90;
          const maxHeight = Math.min(260, contentHeight);
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

        // ✅ LOGO DRAG (en % del content box) — libre X/Y
        case "logoCircle": {
          const { contentW, contentH } = getPreviewSizes();

          const startXpx = pctToPx(drag.logoCircleXPct, contentW);
          const startYpx = pctToPx(drag.logoCircleYPct, contentH);

          const xPct = pxToPct(startXpx + dx, contentW);
          const yPct = pxToPct(startYpx + dy, contentH);

          const clamped = clampLogoPct({
            xPct,
            yPct,
            widthPct: logoCircleWidthPct,
            kind: "circle",
          });

          setLogoCircleXPct(clamped.xPct);
          setLogoCircleYPct(clamped.yPct);
          break;
        }

        case "logoHorizontal": {
          const { contentW, contentH } = getPreviewSizes();

          const startXpx = pctToPx(drag.logoHorizontalXPct, contentW);
          const startYpx = pctToPx(drag.logoHorizontalYPct, contentH);

          const xPct = pxToPct(startXpx + dx, contentW);
          const yPct = pxToPct(startYpx + dy, contentH);

          const clamped = clampLogoPct({
            xPct,
            yPct,
            widthPct: logoHorizontalWidthPct,
            kind: "horizontal",
          });

          setLogoHorizontalXPct(clamped.xPct);
          setLogoHorizontalYPct(clamped.yPct);
          break;
        }

        // ✅ LOGO RESIZE (drag desde handle)
        case "logoCircleResize": {
          const { contentW } = getPreviewSizes();
          const startWpx = (drag.logoCircleWidthPct / 100) * contentW;
          const newWpx = Math.max(24, startWpx + dx);
          const newPct = clamp((newWpx / contentW) * 100, 6, 40);
          setLogoCircleWidthPct(newPct);

          const clamped = clampLogoPct({
            xPct: logoCircleXPct,
            yPct: logoCircleYPct,
            widthPct: newPct,
            kind: "circle",
          });
          setLogoCircleXPct(clamped.xPct);
          setLogoCircleYPct(clamped.yPct);
          break;
        }

        case "logoHorizontalResize": {
          const { contentW } = getPreviewSizes();
          const startWpx = (drag.logoHorizontalWidthPct / 100) * contentW;
          const newWpx = Math.max(48, startWpx + dx);
          const newPct = clamp((newWpx / contentW) * 100, 6, 40);
          setLogoHorizontalWidthPct(newPct);

          const clamped = clampLogoPct({
            xPct: logoHorizontalXPct,
            yPct: logoHorizontalYPct,
            widthPct: newPct,
            kind: "horizontal",
          });
          setLogoHorizontalXPct(clamped.xPct);
          setLogoHorizontalYPct(clamped.yPct);
          break;
        }
      }
    };

    const handleUp = () => setDrag(null);

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseup", handleUp, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [
    drag,
    contentHeight,
    contentTopOffset,
    previewHeaderH,
    previewFooterH,
    logoCircleWidthPct,
    logoHorizontalWidthPct,
    logoCircleXPct,
    logoCircleYPct,
    logoHorizontalXPct,
    logoHorizontalYPct,
  ]);

  function resetPositions() {
    setBlockTop(initialBlockTop);
    setBlockHeight(DEFAULT_BLOCK_HEIGHT);
    setTitleOffsetX(40);
    setTitleOffsetY(30);
    setSubtitleOffsetX(40);
    setSubtitleOffsetY(80);
    setAlertOffsetX(40);
    setAlertOffsetY(10);

    setLogoCircleXPct(82);
    setLogoCircleYPct(10);
    setLogoCircleWidthPct(10);
    setLogoCircleOpacity(0.95);

    setLogoHorizontalXPct(70);
    setLogoHorizontalYPct(10);
    setLogoHorizontalWidthPct(24);
    setLogoHorizontalOpacity(0.95);
  }

  function resetFloatingLogo() {
    if (showLogoHorizontal) {
      setLogoHorizontalXPct(70);
      setLogoHorizontalYPct(10);
      setLogoHorizontalWidthPct(24);
      setLogoHorizontalOpacity(0.95);
      return;
    }
    setLogoCircleXPct(82);
    setLogoCircleYPct(10);
    setLogoCircleWidthPct(10);
    setLogoCircleOpacity(0.95);
  }

  // ✅ % para backend (contentHeight)
  const live = getBackendLayoutPct({
    previewEl: previewRef.current,
    previewHeightFallback: PREVIEW_HEIGHT_FALLBACK,
    showHeaderStrip,
    headerStripHeightPx: previewHeaderH,
    footerHeightPx: previewFooterH,
    blockTopPx: blockTop,
    blockHeightPx: blockHeight,
  });

  const blockTopPct = live.blockTopPct;
  const overlayHeightPct = live.overlayHeightPct;

  // offsets para previews (baseline)
  const titleXFrac = clamp(titleOffsetX / 1280, 0, 1);
  const subtitleXFrac = clamp(subtitleOffsetX / 1280, 0, 1);
  const alertXFrac = clamp(alertOffsetX / 1280, 0, 1);

  const titleYInBlockFrac = clamp(titleOffsetY / Math.max(1, blockHeight), 0, 1);
  const subtitleYInBlockFrac = clamp(
    subtitleOffsetY / Math.max(1, blockHeight),
    0,
    1
  );
  const alertYInBlockFrac = clamp(alertOffsetY / Math.max(1, blockHeight), 0, 1);

  function SocialIcons() {
    return (
      <div className="flex items-center gap-1.5">
        <img
          src={ICON_X}
          alt="X"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="h-6 w-6 rounded-full bg-black/60 p-1"
          onError={(e) =>
          (((e.currentTarget as HTMLImageElement).style.display = "none"),
            undefined)
          }
        />
        <img
          src={ICON_FB}
          alt="Facebook"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="h-6 w-6 rounded-full bg-black/60 p-1"
          onError={(e) =>
          (((e.currentTarget as HTMLImageElement).style.display = "none"),
            undefined)
          }
        />
        <img
          src={ICON_IG}
          alt="Instagram"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="h-6 w-6 rounded-full bg-black/60 p-1"
          onError={(e) =>
          (((e.currentTarget as HTMLImageElement).style.display = "none"),
            undefined)
          }
        />
      </div>
    );
  }

  // ✅ Preview overlays para otras proporciones
  function OverlayLayer(props: { w: number; h: number; showHeader: boolean }) {
    const { w, h, showHeader } = props;

    const footerH = Math.round((FOOTER_HEIGHT / 720) * h);
    const headerH = showHeader
      ? Math.round((HEADER_STRIP_HEIGHT / 720) * h)
      : 0;
    const contentH = Math.max(1, h - footerH - headerH);
    const contentW = Math.max(1, w);

    let topPx = headerH + (blockTopPct / 100) * contentH;
    let heightPx = (overlayHeightPct / 100) * contentH;

    const minTop = headerH;
    const maxTop = headerH + contentH - heightPx;
    topPx = Math.max(minTop, Math.min(maxTop, topPx));
    heightPx = Math.max(1, Math.min(contentH, heightPx));

    const titleLeft = titleXFrac * w;
    const subtitleLeft = subtitleXFrac * w;
    const alertLeft = alertXFrac * w;

    const titleTop = topPx + titleYInBlockFrac * heightPx;
    const subtitleTop = topPx + subtitleYInBlockFrac * heightPx;
    const alertTop = topPx + alertYInBlockFrac * heightPx;

    // ✅ logos flotantes (NO en footer)
    const circleLeft = pctToPx(logoCircleXPct, contentW);
    const circleTop = headerH + pctToPx(logoCircleYPct, contentH);
    const circleW = (logoCircleWidthPct / 100) * contentW;

    const horizLeft = pctToPx(logoHorizontalXPct, contentW);
    const horizTop = headerH + pctToPx(logoHorizontalYPct, contentH);
    const horizW = (logoHorizontalWidthPct / 100) * contentW;
    const horizH = horizW * 0.28;

    return (
      <>
        {showLogoHorizontal && (
          <div
            className="absolute"
            style={{
              left: horizLeft,
              top: horizTop,
              width: horizW,
              height: horizH,
            }}
          >
            <ImgMulti
              candidates={LOGO_HORIZONTAL_CANDIDATES}
              alt="Logo horizontal (preview)"
              className="absolute inset-0 object-contain select-none"
              style={{ opacity: logoHorizontalOpacity }}
            />
          </div>
        )}

        {showLogoCircle && !showLogoHorizontal && (
          <div
            className="absolute"
            style={{
              left: circleLeft,
              top: circleTop,
              width: circleW,
              height: circleW,
            }}
          >
            <ImgMulti
              candidates={LOGO_CIRCLE_CANDIDATES}
              alt="Logo circular (preview)"
              className="absolute inset-0 object-contain select-none"
              style={{ opacity: logoCircleOpacity }}
              rounded
            />
          </div>
        )}

        {showHeader && (headerDate || headerLabel) && (
          <div
            className="absolute inset-x-0 flex items-center justify-between px-4 text-[11px]"
            style={{
              top: 0,
              height: headerH,
              backgroundColor: themeColors.footerBg,
              borderBottom: `1px solid ${themeColors.footerBorder}`,
            }}
          >
            <span className="font-semibold text-slate-200">
              {headerDate || "Fecha"}
            </span>
            {headerLabel && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                {headerLabel}
              </span>
            )}
          </div>
        )}

        <div
          className="absolute left-0 right-0"
          style={{
            top: topPx,
            height: heightPx,
            background: `linear-gradient(to bottom, ${themeColors.bandFrom} 0%, ${themeColors.bandMid} 40%, ${themeColors.bandTo} 100%)`,
            opacity: overlayOpacity,
          }}
        >
          <div className="relative h-full w-full">
            {alertTag && (
              <div
                className="absolute inline-flex select-none items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-[0_4px_20px_rgba(0,0,0,0.7)]"
                style={{
                  left: alertLeft,
                  top: alertTop - topPx,
                  backgroundColor: themeColors.footerBg,
                  color: "#ffffff",
                }}
              >
                {alertTag}
              </div>
            )}

            {title && (
              <span
                className="absolute select-none font-extrabold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                style={{
                  left: titleLeft,
                  top: titleTop - topPx,
                  fontSize: `${Math.max(
                    18,
                    Math.round((titleSize / 1280) * w)
                  )}px`,
                  color: titleColor,
                  whiteSpace: "pre-line",
                  maxWidth: "86%",
                }}
              >
                {title}
              </span>
            )}

            {subtitle && (
              <span
                className="absolute select-none font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
                style={{
                  left: subtitleLeft,
                  top: subtitleTop - topPx,
                  fontSize: `${Math.max(
                    12,
                    Math.round((subtitleSize / 1280) * w)
                  )}px`,
                  color: subtitleColor,
                  whiteSpace: "pre-line",
                  maxWidth: "75%",
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* ✅ Footer FIJO (lockup) */}
        <div
          className="absolute inset-x-0 flex items-center justify-between gap-3 px-4"
          style={{
            bottom: 0,
            height: footerH,
            backgroundColor: themeColors.footerBg,
            borderTop: `1px solid ${themeColors.footerBorder}`,
          }}
        >
          {showFooterLockup ? (
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={BRAND_LOCKUP_SRC}
                alt="Canalibertario lockup"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="h-7 w-7 flex-none rounded-full border border-white/10 bg-black/30 object-cover"
                onError={(e) =>
                (((e.currentTarget as HTMLImageElement).style.display =
                  "none"),
                  undefined)
                }
              />
              <div className="min-w-0">
                <div className="truncate text-xs font-extrabold tracking-tight text-slate-100">
                  CANALIBERTARIO
                </div>
                <div className="truncate text-[10px] text-slate-300">
                  Noticias y análisis (mirada libertaria)
                </div>
              </div>
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-none items-center gap-3">
            <div className="opacity-95" style={{ color: brandColor }}>
              <SocialIcons />
            </div>
            {footer.trim() ? (
              <span className="text-[10px] text-slate-300">{footer.trim()}</span>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  // slider altura fondo (barra) sobre contentHeight
  const overlayHeightPctUI = Math.round(
    (blockHeight / Math.max(1, contentHeight)) * 100
  );

  async function ensureFileFromPreviewUrl(): Promise<File | null> {
    if (!previewUrl) return null;
    try {
      const res = await fetch(previewUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      const mime = blob.type || "image/jpeg";
      return new File([blob], "image-from-preview.jpg", { type: mime });
    } catch {
      return null;
    }
  }

  const handleGenerate = async () => {
    if (!previewUrl && !file) {
      setErrorMsg(
        "Primero seleccioná una imagen base (o asegurate que se haya cargado la del artículo)."
      );
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      let effectiveFile = file;
      if (!effectiveFile) {
        effectiveFile = await ensureFileFromPreviewUrl();
        if (effectiveFile) setFile(effectiveFile);
      }

      if (!effectiveFile) {
        throw new Error(
          "No pude armar el archivo de imagen para enviar. Esto suele ser CORS entre el front y el servidor de imágenes. Solución: habilitar CORS en el backend de uploads, o servir la imagen desde el mismo dominio/origen del front."
        );
      }

      const fd = new FormData();
      fd.append("file", effectiveFile);

      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("news_access_token")
          : null;
      if (token) fd.append("accessToken", token);

      const footerText = footer.trim() || null;

      const useHorizontal = showLogoHorizontal;
      const useCircle = showLogoCircle && !showLogoHorizontal;

      const logoOverlay =
        useHorizontal || useCircle
          ? {
            enabled: true,
            kind: useHorizontal ? "horizontal" : "circle",
            xPct: useHorizontal ? logoHorizontalXPct : logoCircleXPct,
            yPct: contentYPctToCanvasYPct({
              yContentPct: useHorizontal ? logoHorizontalYPct : logoCircleYPct,
              showHeaderStrip,
            }),
            widthPct: useHorizontal
              ? logoHorizontalWidthPct
              : logoCircleWidthPct,
            opacity: useHorizontal ? logoHorizontalOpacity : logoCircleOpacity,
          }
          : { enabled: false };

      const brandConfig = {
        brandName: "CANALIBERTARIO",
        assets: {
          // el backend usa paths; dejamos el “primero” (el que te interesa)
          logoCirclePath: LOGO_CIRCLE_CANDIDATES[0],
          logoHorizontalPath: LOGO_HORIZONTAL_CANDIDATES[0],
          footerLockupPath: BRAND_LOCKUP_SRC,
        },
      };

      const layout = {
        textPosition: "custom",
        blockTopPct,
        overlayHeightPct,
        overlayOpacity,
        titleFontPx: titleSize,
        subtitleFontPx: subtitleSize,

        headerStrip: showHeaderStrip
          ? {
            date: headerDate || null,
            label: headerLabel || null,
          }
          : null,

        // ✅ footer lockup FIJO
        footerLeft: {
          enabled: true,
          kind: "lockup",
        },

        // ✅ logo flotante real
        logoOverlay,
      };

      const colors = {
        theme: theme === "wine" ? "red" : theme,
        title: titleColor,
        subtitle: subtitleColor,
        handle: brandColor,
        alertBg: themeColors.footerBg,
      };

      const options = {
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        footer: footerText,
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

      const finalUrl: string | null =
        data?.imageUrl ??
        data?.coverUrl ??
        data?.enhancedImageUrl ??
        data?.url ??
        null;

      if (!finalUrl) {
        const coverError = data?.coverError?.message
          ? ` (${data.coverError.message})`
          : "";
        throw new Error(`El backend no devolvió imageUrl/coverUrl${coverError}`);
      }

      setStatusMsg(
        data?.message ?? "Cover generada. URL copiada al portapapeles."
      );

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(finalUrl);
        } catch { }
      }

      if (typeof window !== "undefined" && window.opener && window.location) {
        try {
          window.opener.postMessage(
            { type: "editor-image-url", url: finalUrl },
            window.location.origin
          );
        } catch { }
      }
    } catch (err: any) {
      console.error("[editor-full] error:", err);
      setErrorMsg(err?.message ?? "Error al generar la portada.");
    } finally {
      setSaving(false);
    }
  };

  // px del logo flotante en preview 16:9
  const previewW =
    previewRef.current?.getBoundingClientRect().width ?? 1280;
  const previewH =
    previewRef.current?.getBoundingClientRect().height ?? 720;
  const contentW = Math.max(1, previewW);
  const contentH = Math.max(1, previewH - previewHeaderH - previewFooterH);

  const circleLeft = pctToPx(logoCircleXPct, contentW);
  const circleTop = previewHeaderH + pctToPx(logoCircleYPct, contentH);
  const circleW = (logoCircleWidthPct / 100) * contentW;

  const horizLeft = pctToPx(logoHorizontalXPct, contentW);
  const horizTop = previewHeaderH + pctToPx(logoHorizontalYPct, contentH);
  const horizW = (logoHorizontalWidthPct / 100) * contentW;
  const horizH = horizW * 0.28; // ✅ hitbox real para drag vertical

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:py-8">
        {/* IZQUIERDA */}
        <div className="flex-1 space-y-4">
          <header className="mb-2 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Editor de portadas · Pantalla completa
            </div>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
              Ajustá textos y vista previa en grande antes de generar la cover.
            </h1>
          </header>

          <section
            ref={containerRef}
            className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/90 shadow-[0_32px_90px_rgba(15,23,42,0.95)]"
          >
            <div className="flex items-center justify-between px-6 pt-4 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              <span>Vista previa 16:9</span>
              <span>Base ideal para X / Facebook / YouTube</span>
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
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className="h-full w-full object-cover"
                  />

                  {/* ✅ LOGOS FLOTANTES (DRAG + RESIZE HANDLE) */}
                  {showLogoHorizontal && (
                    <div
                      className="absolute cursor-move"
                      style={{
                        left: horizLeft,
                        top: horizTop,
                        width: horizW,
                        height: horizH,
                        zIndex: 30,

                        // ✅ hitbox visible suave para que no sea "un punto"
                        background: "rgba(0,0,0,0.18)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        borderRadius: 12,
                        backdropFilter: "blur(1px)",
                      }}
                      onMouseDown={(e) => startDrag("logoHorizontal", e)}
                    >
                      <ImgMulti
                        candidates={LOGO_HORIZONTAL_CANDIDATES}
                        alt="Logo horizontal (floating)"
                        className="absolute inset-0 object-contain select-none"
                        style={{ opacity: logoHorizontalOpacity, pointerEvents: "none" }}
                      />

                      <div
                        className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border border-white/30 bg-black/60 shadow"
                        title="Redimensionar"
                        onMouseDown={(e) => startDrag("logoHorizontalResize", e)}
                      />
                    </div>
                  )}

                  {showLogoCircle && !showLogoHorizontal && (
                    <div
                      className="absolute cursor-move rounded-full"
                      style={{
                        left: circleLeft,
                        top: circleTop,
                        width: circleW,
                        height: circleW,
                        zIndex: 30,

                        // ✅ hitbox visible
                        background: "rgba(0,0,0,0.18)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        backdropFilter: "blur(1px)",
                      }}
                      onMouseDown={(e) => startDrag("logoCircle", e)}
                    >

                      <ImgMulti
                        candidates={LOGO_CIRCLE_CANDIDATES}
                        alt="Logo circular (floating)"
                        className="absolute inset-0 rounded-full object-contain select-none"
                        style={{ opacity: logoCircleOpacity, pointerEvents: "none" }}
                        rounded
                      />

                      <div
                        className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border border-white/30 bg-black/60 shadow"
                        title="Redimensionar"
                        onMouseDown={(e) => startDrag("logoCircleResize", e)}
                      />
                    </div>
                  )}

                  {/* BLOQUE */}
                  <div
                    className="absolute left-0 right-0 cursor-move"
                    style={{
                      top: blockTop,
                      height: blockHeight,
                      background: `linear-gradient(to bottom, ${themeColors.bandFrom} 0%, ${themeColors.bandMid} 40%, ${themeColors.bandTo} 100%)`,
                      opacity: overlayOpacity,
                      zIndex: 20,
                    }}
                    onMouseDown={(e) => startDrag("block", e)}
                  >
                    <div className="relative h-full w-full">
                      {alertTag && (
                        <div
                          className="absolute inline-flex cursor-move select-none items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-[0_4px_20px_rgba(0,0,0,0.7)]"
                          style={{
                            left: alertOffsetX,
                            top: alertOffsetY,
                            backgroundColor: themeColors.footerBg,
                            color: "#ffffff",
                          }}
                          onMouseDown={(e) => startDrag("alert", e)}
                        >
                          {alertTag}
                        </div>
                      )}

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

                      <div
                        className="absolute bottom-2 left-[10%] right-[10%] h-1.5 cursor-ns-resize rounded-full bg-slate-200/80"
                        onMouseDown={(e) => startDrag("resize", e)}
                      />
                    </div>
                  </div>

                  {/* HEADER */}
                  {showHeaderStrip && (headerDate || headerLabel) && (
                    <div
                      className="absolute inset-x-0 flex items-center justify-between px-6 text-xs"
                      style={{
                        top: 0,
                        height: previewHeaderH,
                        backgroundColor: themeColors.footerBg,
                        borderBottom: `1px solid ${themeColors.footerBorder}`,
                        zIndex: 40,
                      }}
                    >
                      <span className="font-semibold text-slate-200">
                        {headerDate || "Fecha / contexto"}
                      </span>
                      {headerLabel && (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                          {headerLabel}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ✅ FOOTER FIJO (lockup) */}
                  <div
                    className="absolute inset-x-0 flex items-center justify-between gap-3 px-8"
                    style={{
                      bottom: 0,
                      height: previewFooterH,
                      backgroundColor: themeColors.footerBg,
                      borderTop: `1px solid ${themeColors.footerBorder}`,
                      zIndex: 50,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={BRAND_LOCKUP_SRC}
                        alt="Canalibertario lockup"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        className="h-8 w-8 flex-none rounded-full border border-white/10 bg-black/30 object-cover"
                        onError={(e) =>
                        (((e.currentTarget as HTMLImageElement).style.display =
                          "none"),
                          undefined)
                        }
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold tracking-tight text-slate-100">
                          CANALIBERTARIO
                        </div>
                        <div className="truncate text-[11px] text-slate-300">
                          Noticias y análisis (mirada libertaria)
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-none items-center gap-3">
                      <div style={{ color: brandColor }}>
                        <SocialIcons />
                      </div>
                      {footer.trim() ? (
                        <span className="text-[11px] text-slate-300">
                          {footer.trim()}
                        </span>
                      ) : null}
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

            {/* COLORES */}
            <div className="mt-4 rounded-b-3xl border-t border-slate-800 bg-slate-950/80 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Colores y tema
                </h2>

                <label className="flex items-center gap-2 text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={showSocialPreviews}
                    onChange={(e) => setShowSocialPreviews(e.target.checked)}
                    className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                  />
                  Mostrar previews de recorte (imágenes)
                </label>
              </div>

              <div className="mt-3 space-y-3 text-[11px]">
                <div className="space-y-2">
                  <span className="block text-slate-300">Tema oficial</span>
                  <div className="flex flex-wrap gap-2">
                    {(["purple", "red", "blue", "black"] as CoverTheme[]).map(
                      (t) => (
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
                      )
                    )}
                  </div>

                  <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-[11px] text-slate-300">
                    <b>Regla:</b> Header / Footer / Etiqueta usan el mismo color
                    del theme (barBg).
                  </div>
                </div>

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

                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-32 text-slate-300">Color iconos</span>
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

                <button
                  type="button"
                  onClick={resetPositions}
                  className="mt-2 inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:border-sky-400 hover:bg-slate-800"
                >
                  Reiniciar posiciones
                </button>
              </div>
            </div>
          </section>

          {/* Previews recorte */}
          {showSocialPreviews && previewUrl ? (
            <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Previews recorte (imágenes)
                </h2>
                <span className="text-[11px] text-slate-500">
                  Visual. La generación final la hace el backend.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300">
                    16:9 (X / Facebook / YouTube)
                  </div>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-slate-800 bg-black/60">
                    <img
                      src={previewUrl}
                      alt="16:9"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className="h-full w-full object-cover"
                    />
                    <OverlayLayer w={1280} h={720} showHeader={showHeaderStrip} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300">
                    1:1 (Instagram feed)
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-800 bg-black/60">
                    <img
                      src={previewUrl}
                      alt="1:1"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className="h-full w-full object-cover"
                    />
                    <OverlayLayer w={1080} h={1080} showHeader={false} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300">
                    4:5 (Instagram feed alto)
                  </div>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate-800 bg-black/60">
                    <img
                      src={previewUrl}
                      alt="4:5"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className="h-full w-full object-cover"
                    />
                    <OverlayLayer w={1080} h={1350} showHeader={false} />
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        {/* DERECHA */}
        <aside className="w-full max-w-md space-y-4">
          <section className="space-y-4 rounded-3xl border border-slate-900 bg-slate-950/90 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Imagen base
            </h2>

            {/* BRANDING */}
            <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Branding (logos flotantes)
              </h3>

              <label className="flex items-center gap-2 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={showLogoCircle}
                  onChange={(e) => setShowLogoCircle(e.target.checked)}
                  className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                />
                Mostrar logo circular (overlay)
              </label>

              <label className="flex items-center gap-2 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={showLogoHorizontal}
                  onChange={(e) => setShowLogoHorizontal(e.target.checked)}
                  className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                />
                Mostrar logo horizontal (overlay)
              </label>

              <div className="text-[10px] text-slate-500">
                Tip: arrastrá el logo en la preview. Para agrandar/achicar, usá el
                handle (esquina) o el slider.
              </div>

              {/* ✅ controles SOLO tamaño/opacidad */}
              {(showLogoCircle || showLogoHorizontal) && (
                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-[11px] text-slate-200">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Logo flotante: tamaño y opacidad
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span>Tamaño (% ancho)</span>
                        <span className="text-slate-400">
                          {showLogoHorizontal
                            ? logoHorizontalWidthPct
                            : logoCircleWidthPct}
                          %
                        </span>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={40}
                        value={
                          showLogoHorizontal
                            ? logoHorizontalWidthPct
                            : logoCircleWidthPct
                        }
                        onChange={(e) => {
                          const v = Number(e.target.value);

                          if (showLogoHorizontal) {
                            setLogoHorizontalWidthPct(v);
                            const c = clampLogoPct({
                              xPct: logoHorizontalXPct,
                              yPct: logoHorizontalYPct,
                              widthPct: v,
                              kind: "horizontal",
                            });
                            setLogoHorizontalXPct(c.xPct);
                            setLogoHorizontalYPct(c.yPct);
                          } else {
                            setLogoCircleWidthPct(v);
                            const c = clampLogoPct({
                              xPct: logoCircleXPct,
                              yPct: logoCircleYPct,
                              widthPct: v,
                              kind: "circle",
                            });
                            setLogoCircleXPct(c.xPct);
                            setLogoCircleYPct(c.yPct);
                          }
                        }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span>Opacidad</span>
                        <span className="text-slate-400">
                          {(
                            showLogoHorizontal
                              ? logoHorizontalOpacity
                              : logoCircleOpacity
                          ).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.2}
                        max={1}
                        step={0.01}
                        value={
                          showLogoHorizontal
                            ? logoHorizontalOpacity
                            : logoCircleOpacity
                        }
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          showLogoHorizontal
                            ? setLogoHorizontalOpacity(v)
                            : setLogoCircleOpacity(v);
                        }}
                        className="w-full"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={resetFloatingLogo}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
                    >
                      Reset logo flotante
                    </button>
                  </div>
                </div>
              )}
            </div>

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

            {/* Textos */}
            <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Textos
              </h3>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">
                  Título principal{" "}
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
                  Bajada / descripción{" "}
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
                      placeholder="24/12/2025 - 11:48"
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
                  Footer (fecha / contexto corto){" "}
                  <span className="ml-1 text-[10px] text-slate-500">(sin URL)</span>
                </label>
                <input
                  type="text"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  placeholder="24/12/2025 · 11:48"
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
                    onChange={(e) => setSubtitleSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="border-t border-slate-800 pt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span>Altura del fondo (barra)</span>
                    <span className="text-slate-400">{overlayHeightPctUI}%</span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={65}
                    value={overlayHeightPctUI}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      setBlockHeight(
                        Math.round((pct / 100) * Math.max(1, contentHeight))
                      );
                    }}
                    className="w-full"
                  />
                </div>

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
                </div>
              </div>
            </div>
          </section>

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
                <b>Etiqueta:</b> {alertTag || "(sin)"}
              </div>
              <div>
                <b>Franja superior:</b>{" "}
                {showHeaderStrip
                  ? `${headerDate || "sin fecha"} · ${headerLabel || "sin etiqueta"
                  }`
                  : "desactivada"}
              </div>
              <div>
                <b>Footer:</b> {footer.trim() || "(vacío)"}{" "}
                <span className="text-slate-500">(sin URL)</span>
              </div>
              <div>
                <b>Tema de color:</b> {themeLabel(theme)}
              </div>
              <div>
                <b>% enviado al backend:</b> top {blockTopPct.toFixed(1)}% · alto{" "}
                {overlayHeightPct.toFixed(1)}%
              </div>
              <div>
                <b>Logo flotante:</b>{" "}
                {showLogoHorizontal
                  ? `horizontal (w ${logoHorizontalWidthPct.toFixed(
                    1
                  )}% · op ${logoHorizontalOpacity.toFixed(2)})`
                  : showLogoCircle
                    ? `circular (w ${logoCircleWidthPct.toFixed(
                      1
                    )}% · op ${logoCircleOpacity.toFixed(2)})`
                    : "off"}
              </div>
              <div className="text-slate-500">
                (posición se define arrastrando en la preview)
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={saving || (!previewUrl && !file)}
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
