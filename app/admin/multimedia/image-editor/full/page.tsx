"use client";

import {
  useState,
  useEffect,
  useRef,
  MouseEvent as ReactMouseEvent,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";

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
  | "asset"
  | "assetResize"
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

  logoCircleXPct: number;
  logoCircleYPct: number;
  logoCircleWidthPct: number;

  logoHorizontalXPct: number;
  logoHorizontalYPct: number;
  logoHorizontalWidthPct: number;

  // ✅ asset overlay
  assetId?: string | null;
  assetXPct?: number;
  assetYPct?: number;
  assetWidthPct?: number;
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

// ✅ logos flotantes (overlay)
const LOGO_CIRCLE_CANDIDATES = [
  "/brand/Logos/logo-circular.png",
  "/brand/logos/logo-circular.png",
  "/brand/logo-circular.png",
  "/brand/logo-circular.webp",
  "/brand/logo-circular.svg",
  "/brand/canalibertario.png",
];

const LOGO_HORIZONTAL_CANDIDATES = [
  "/brand/Logos/logo-horizontal.png",
  "/brand/logos/logo-horizontal.png",
  "/brand/logo-horizontal.png",
  "/brand/logo-horizontal.webp",
  "/brand/logo-horizontal.svg",
  "/brand/canalibertario.png",
];

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

function getScaledBarsForPreview(args: { previewH: number; showHeaderStrip: boolean }) {
  const h = Math.max(1, args.previewH);

  const footerH = Math.round((FOOTER_HEIGHT / 720) * h);
  const headerH = args.showHeaderStrip ? Math.round((HEADER_STRIP_HEIGHT / 720) * h) : 0;

  const contentTopOffset = headerH;
  const contentHeight = Math.max(1, h - footerH - headerH);

  return { footerH, headerH, contentTopOffset, contentHeight };
}

function getBackendLayoutPct(args: {
  previewEl: HTMLDivElement | null;
  previewHeightFallback: number;

  showHeaderStrip: boolean;

  blockTopPx: number;
  blockHeightPx: number;
}) {
  const liveH =
    args.previewEl?.getBoundingClientRect().height &&
      args.previewEl.getBoundingClientRect().height > 0
      ? args.previewEl.getBoundingClientRect().height
      : args.previewHeightFallback;

  // ✅ recalcular igual que backend (proporcional a liveH)
  const footerH = Math.round((FOOTER_HEIGHT / 720) * liveH);
  const headerH = args.showHeaderStrip
    ? Math.round((HEADER_STRIP_HEIGHT / 720) * liveH)
    : 0;

  const contentH = Math.max(1, liveH - footerH - headerH);

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

function contentYPctToCanvasYPct(args: { yContentPct: number; showHeaderStrip: boolean }) {
  const headerH = args.showHeaderStrip ? HEADER_STRIP_HEIGHT : 0;
  const footerH = FOOTER_HEIGHT;
  const contentH = 720 - headerH - footerH;

  const yPxInCanvas = headerH + (clamp(args.yContentPct, 0, 100) / 100) * contentH;
  return (yPxInCanvas / 720) * 100;
}

// ✅ Img que intenta múltiples paths
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

// -----------------------
// ✅ Biblioteca
// -----------------------
type LibraryItem = {
  scope: "raw" | "cover" | "screen";
  relPath: string;
  filename: string;
  url: string;
  bytes: number;
  mtimeMs: number;
  category: string | null;
  group: string | null;
  tokens: string[];
};

type LibrarySelectMode = "base" | "overlay";

type AssetOverlay = {
  id: string;
  item: LibraryItem;
  // % dentro del CONTENT BOX (igual que tus logos)
  xPct: number;
  yPct: number;
  widthPct: number; // % del ancho del content
  opacity: number;  // 0..1

  label?: {
    line1?: string; // ej: "JAVIER MILEI"
    line2?: string; // ej: "PRESIDENTE ARGENTINO"
  };
};


function bytesToHuman(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

export default function ImageEditorFullPage() {
  const searchParams = useSearchParams();
  const previewRef = useRef<HTMLDivElement | null>(null);

  const [previewHeight, setPreviewHeight] = useState(PREVIEW_HEIGHT_FALLBACK);

  // ✅ Backend assets base (para thumbs)
  const ASSET_BASE = useMemo(() => {
    return (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5001").replace(/\/+$/, "");
  }, []);

  const abs = (maybePath: string) => {
    if (!maybePath) return "";
    if (maybePath.startsWith("http://") || maybePath.startsWith("https://")) return maybePath;
    if (maybePath.startsWith("/")) return `${ASSET_BASE}${maybePath}`;
    return `${ASSET_BASE}/${maybePath}`;
  };

  // Imagen base
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // branding
  const [showLogoCircle, setShowLogoCircle] = useState(false);
  const [showLogoHorizontal, setShowLogoHorizontal] = useState(false);

  // logo overlay
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
  const [blockTop, setBlockTop] = useState(0);
  const [blockHeight, setBlockHeight] = useState(DEFAULT_BLOCK_HEIGHT);
  const [initialBlockTop, setInitialBlockTop] = useState(0);
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

  // ✅ Biblioteca state
  const [libOpen, setLibOpen] = useState(true);
  const [libScope, setLibScope] = useState<"raw" | "covers" | "screens" | "all">("raw");
  const [libQ, setLibQ] = useState("");
  const [libCategory, setLibCategory] = useState("");
  const [libGroup, setLibGroup] = useState("");
  const [libBusy, setLibBusy] = useState(false);
  const [libItems, setLibItems] = useState<LibraryItem[]>([]);
  const [libErr, setLibErr] = useState<string | null>(null);
  const [libSelectMode, setLibSelectMode] = useState<LibrarySelectMode>("base");
  // overlays (banderas / símbolos / etc) arriba de la imagen base
  const [assetOverlays, setAssetOverlays] = useState<AssetOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);


  const libCategories = useMemo(() => {
    const s = new Set<string>();
    for (const it of libItems) if (it.category) s.add(it.category);
    return Array.from(s).sort();
  }, [libItems]);

  const libGroups = useMemo(() => {
    const s = new Set<string>();
    for (const it of libItems) if (it.group) s.add(it.group);
    return Array.from(s).sort();
  }, [libItems]);

  const peopleGroups = useMemo(() => {
    const s = new Set<string>();
    for (const it of libItems) if (it.category === "personas" && it.group) s.add(it.group);
    return Array.from(s).sort();
  }, [libItems]);

  const assetsCategories = useMemo(() => {
    // categorías típicas para “assets”
    const wanted = new Set(["simbolos", "mapas", "graficos", "caras-circulares", "caras_circulares"]);
    return libCategories.filter((c) => wanted.has(c));
  }, [libCategories]);

  async function fetchLibrary() {
    setLibBusy(true);
    setLibErr(null);
    try {
      const qs = new URLSearchParams();
      qs.set("scope", libScope);
      if (libQ.trim()) qs.set("q", libQ.trim());
      if (libCategory.trim()) qs.set("category", libCategory.trim());
      if (libGroup.trim()) qs.set("group", libGroup.trim());
      qs.set("limit", "800");

      const res = await fetch(`/api/editor-images/enhance?${qs.toString()}`, { method: "GET" });
      const raw = await res.text().catch(() => "");
      const json = raw ? JSON.parse(raw) : null;

      if (!res.ok) {
        setLibErr(json?.message ?? `Error biblioteca (${res.status})`);
        setLibItems([]);
        return;
      }

      setLibItems((json?.items ?? []) as LibraryItem[]);
    } catch (e: any) {
      setLibErr(e?.message ?? "Error inesperado en biblioteca");
      setLibItems([]);
    } finally {
      setLibBusy(false);
    }
  }

  function selectBaseFromLibrary(item: LibraryItem) {
    const u = abs(item.url);
    setPreviewUrl(u);
    setFile(null);
    setStatusMsg(`Imagen base: ${item.relPath}`);
    setErrorMsg(null);
  }

  function addOverlayFromLibrary(item: LibraryItem) {
    const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    setAssetOverlays((prev) => [
      ...prev,
      {
        id,
        item,
        xPct: 8,
        yPct: 8,
        widthPct: 22,
        opacity: 1,
      },
    ]);

    setStatusMsg(`Overlay agregado: ${item.relPath}`);
    setErrorMsg(null);
  }

  function clearLibraryFilters() {
    setLibQ("");
    setLibCategory("");
    setLibGroup("");
  }

  function quickPeopleSelect(group: string) {
    setLibScope("raw");
    setLibCategory("personas");
    setLibGroup(group || "");
  }

  function quickAssetsSelect(category: string, group?: string) {
    setLibScope("raw");
    setLibCategory(category || "");
    setLibGroup(group || "");
  }

  // mutual exclusive logos
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

  // init desde querystring
  useEffect(() => {
    const imageUrl = searchParams.get("imageUrl");
    const initialTitle = searchParams.get("title") ?? "";
    const initialSubtitle = searchParams.get("subtitle") ?? "";

    const initialFooterRaw = (searchParams.get("footer") ?? "").trim();
    const initialFooter = isUrlLike(initialFooterRaw) ? "" : initialFooterRaw;

    const initialAlert = (searchParams.get("alertTag") as AlertTag | null) ?? "";
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

    const textPosParam = searchParams.get("textPosition");

    // ✅ default: pegado al footer (bottom real)
    const footerTop = contentTopOffset + contentHeight;
    let startTop = footerTop - DEFAULT_BLOCK_HEIGHT;

    // si viene textPosition por query, respetarlo
    if (textPosParam === "top") startTop = contentTopOffset;
    else if (textPosParam === "middle") {
      startTop = contentTopOffset + Math.round((contentHeight - DEFAULT_BLOCK_HEIGHT) / 2);
    }

    // clamp final
    const minTop = contentTopOffset;
    const maxTop = contentTopOffset + contentHeight - DEFAULT_BLOCK_HEIGHT;
    startTop = Math.min(maxTop, Math.max(minTop, startTop));

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
        setPreviewUrl(imageUrl);
        setFile(null);
      } finally {
        setLoadingImage(false);
      }
    })();
  }, [searchParams]);

  // auto-load biblioteca al abrir (una vez)
  useEffect(() => {
    if (!libOpen) return;
    if (libItems.length > 0) return;
    void fetchLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libOpen]);

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

  // Área útil preview 16:9
  const effectiveHeight = previewHeight || PREVIEW_HEIGHT_FALLBACK;
  const bars = getScaledBarsForPreview({ previewH: effectiveHeight, showHeaderStrip });

  const contentTopOffset = bars.contentTopOffset;
  const contentHeight = bars.contentHeight;
  const previewHeaderH = bars.headerH;
  const previewFooterH = bars.footerH;

  function getPreviewSizes() {
    const previewW = previewRef.current?.getBoundingClientRect().width ?? 1280;
    const previewH = previewRef.current?.getBoundingClientRect().height ?? 720;
    const contentW = Math.max(1, previewW);
    const contentH = Math.max(1, previewH - previewHeaderH - previewFooterH);
    return { previewW, previewH, contentW, contentH };
  }

  function getLiveContentBox() {
    const previewW = previewRef.current?.getBoundingClientRect().width ?? 1280;
    const previewH = previewRef.current?.getBoundingClientRect().height ?? 720;

    const footerH = Math.round((FOOTER_HEIGHT / 720) * previewH);
    const headerH = showHeaderStrip ? Math.round((HEADER_STRIP_HEIGHT / 720) * previewH) : 0;

    const contentTop = headerH;
    const contentH = Math.max(1, previewH - headerH - footerH);

    return { previewW, previewH, contentW: previewW, footerH, headerH, contentTop, contentH };
  }

  function getGuideXpx() {
    // guía = X de la bajada (podés cambiar a titleOffsetX si querés)
    return subtitleOffsetX;
  }

  function alignAllToGuideX() {
    const guideX = getGuideXpx();

    // Textos
    setTitleOffsetX(guideX);
    setAlertOffsetX(guideX);

    // Overlays (assets): convierto guía px -> % del content para xPct
    const { contentW } = getPreviewSizes();
    const guideXPct = pxToPct(guideX, contentW);

    setAssetOverlays((prev) =>
      prev.map((o) => ({ ...o, xPct: guideXPct })),
    );

    // Logos flotantes: sus X están en % del content
    // (si querés alinear solo el activo, podés condicionar)
    setLogoCircleXPct(guideXPct);
    setLogoHorizontalXPct(guideXPct);
  }



  function clampLogoPct(args: {
    xPct: number;
    yPct: number;
    widthPct: number;
    kind: "circle" | "horizontal";
  }) {
    const { contentW, contentH } = getPreviewSizes();
    const wPx = (args.widthPct / 100) * contentW;
    const hPx = args.kind === "circle" ? wPx : wPx * 0.28;

    const xPx = pctToPx(args.xPct, contentW);
    const yPx = pctToPx(args.yPct, contentH);

    const maxX = Math.max(0, contentW - wPx);
    const maxY = Math.max(0, contentH - hPx);

    const xClamped = clamp(xPx, 0, maxX);
    const yClamped = clamp(yPx, 0, maxY);

    return { xPct: pxToPct(xClamped, contentW), yPct: pxToPct(yClamped, contentH) };
  }

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

  useEffect(() => {
    // solo seteo inicial, no pisar si ya fue seteado
    if (initialBlockTop !== 0) return;

    const el = previewRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (!rect.height || rect.height < 50) return;

    const previewH = rect.height;

    const footerH = Math.round((FOOTER_HEIGHT / 720) * previewH);
    const headerH = showHeaderStrip ? Math.round((HEADER_STRIP_HEIGHT / 720) * previewH) : 0;

    const contentTop = headerH;
    const contentH = Math.max(1, previewH - headerH - footerH);

    const minTop = contentTop;
    const maxTop = contentTop + contentH - DEFAULT_BLOCK_HEIGHT;

    // ✅ bottom real
    const startTop = Math.min(maxTop, Math.max(minTop, contentTop + contentH - DEFAULT_BLOCK_HEIGHT));

    setBlockTop(startTop);
    setInitialBlockTop(startTop);
    setBlockHeight(DEFAULT_BLOCK_HEIGHT);
  }, [showHeaderStrip, initialBlockTop]);


  useEffect(() => {
    if (!drag) return;

    // ✅ medidas LIVE del preview (para que el clamp coincida con backend)
    const getLiveContentBox = () => {
      const previewW = previewRef.current?.getBoundingClientRect().width ?? 1280;
      const previewH = previewRef.current?.getBoundingClientRect().height ?? 720;

      const footerH = Math.round((FOOTER_HEIGHT / 720) * previewH);
      const headerH = showHeaderStrip
        ? Math.round((HEADER_STRIP_HEIGHT / 720) * previewH)
        : 0;

      const contentTop = headerH;
      const contentH = Math.max(1, previewH - headerH - footerH);

      return { previewW, previewH, contentW: previewW, footerH, headerH, contentTop, contentH };
    };

    const handleMove = (ev: MouseEvent) => {
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;

      switch (drag.target) {
        case "block": {
          const { contentTop, contentH } = getLiveContentBox();

          // ✅ clamp real (sin +12)
          const minTop = contentTop;
          const maxTop = contentTop + contentH - drag.blockHeight;

          const newTop = drag.blockTop + dy;
          setBlockTop(Math.min(maxTop, Math.max(minTop, newTop)));
          break;
        }

        case "resize": {
          const { contentTop, contentH } = getLiveContentBox();

          const minHeight = 90;
          const maxHeight = Math.min(260, contentH);

          const newH = Math.min(maxHeight, Math.max(minHeight, drag.blockHeight + dy));
          setBlockHeight(newH);

          // ✅ si agrandás/achicás, re-clamp top para que no se salga del content
          const minTop = contentTop;
          const maxTop = contentTop + contentH - newH;
          setBlockTop((prev) => Math.min(maxTop, Math.max(minTop, prev)));

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

        case "asset": {
          const assetId = drag.assetId;
          if (!assetId) break;

          const { contentW, contentH } = getPreviewSizes();

          const startXPct = drag.assetXPct ?? 0;
          const startYPct = drag.assetYPct ?? 0;
          const widthPct =
            assetOverlays.find((o) => o.id === assetId)?.widthPct ??
            (drag.assetWidthPct ?? 20);

          const startXpx = pctToPx(startXPct, contentW);
          const startYpx = pctToPx(startYPct, contentH);

          const xPct = pxToPct(startXpx + dx, contentW);
          const yPct = pxToPct(startYpx + dy, contentH);

          const wPx = (widthPct / 100) * contentW;
          const hPx = wPx * 0.66;

          const maxX = Math.max(0, contentW - wPx);
          const maxY = Math.max(0, contentH - hPx);

          const xClampedPct = pxToPct(clamp(pctToPx(xPct, contentW), 0, maxX), contentW);
          const yClampedPct = pxToPct(clamp(pctToPx(yPct, contentH), 0, maxY), contentH);

          setAssetOverlays((prev) =>
            prev.map((o) =>
              o.id === assetId ? { ...o, xPct: xClampedPct, yPct: yClampedPct } : o,
            ),
          );
          break;
        }

        case "assetResize": {
          const assetId = drag.assetId;
          if (!assetId) break;

          const { contentW, contentH } = getPreviewSizes();
          const startW =
            drag.assetWidthPct ??
            assetOverlays.find((o) => o.id === assetId)?.widthPct ??
            20;

          const startWpx = (startW / 100) * contentW;
          const newWpx = Math.max(24, startWpx + dx);
          const newPct = clamp((newWpx / contentW) * 100, 6, 60);

          const ov = assetOverlays.find((o) => o.id === assetId);
          const xPct = ov?.xPct ?? (drag.assetXPct ?? 0);
          const yPct = ov?.yPct ?? (drag.assetYPct ?? 0);

          const wPx = (newPct / 100) * contentW;
          const hPx = wPx * 0.66;

          const maxX = Math.max(0, contentW - wPx);
          const maxY = Math.max(0, contentH - hPx);

          const xClampedPct = pxToPct(clamp(pctToPx(xPct, contentW), 0, maxX), contentW);
          const yClampedPct = pxToPct(clamp(pctToPx(yPct, contentH), 0, maxY), contentH);

          setAssetOverlays((prev) =>
            prev.map((o) =>
              o.id === assetId
                ? { ...o, widthPct: newPct, xPct: xClampedPct, yPct: yClampedPct }
                : o,
            ),
          );
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
    // ✅ ahora depende de showHeaderStrip (porque getLiveContentBox lo usa)
    showHeaderStrip,

    // resto como estaba
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
    assetOverlays,
  ]);


  useEffect(() => {
    console.log("imageOverlays", assetOverlays);
  }, [assetOverlays]);


  function resetPositions() {
    // ✅ reset del bloque: bottom real (pegado al footer), no "initialBlockTop"
    const el = previewRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const previewH = rect.height || 720;

      const footerH = Math.round((FOOTER_HEIGHT / 720) * previewH);
      const headerH = showHeaderStrip
        ? Math.round((HEADER_STRIP_HEIGHT / 720) * previewH)
        : 0;

      const contentTop = headerH;
      const contentH = Math.max(1, previewH - headerH - footerH);

      const minTop = contentTop;
      const maxTop = contentTop + contentH - DEFAULT_BLOCK_HEIGHT;

      const startTop = Math.min(
        maxTop,
        Math.max(minTop, contentTop + contentH - DEFAULT_BLOCK_HEIGHT),
      );

      setBlockTop(startTop);
      setInitialBlockTop(startTop);
    } else {
      // fallback
      setBlockTop(0);
      setInitialBlockTop(0);
    }
    setShowLogoCircle(false);
    setShowLogoHorizontal(false);


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

  const live = getBackendLayoutPct({
    previewEl: previewRef.current,
    previewHeightFallback: PREVIEW_HEIGHT_FALLBACK,
    showHeaderStrip,
    blockTopPx: blockTop,
    blockHeightPx: blockHeight,
  });

  const blockTopPct = live.blockTopPct;
  const overlayHeightPct = live.overlayHeightPct;

  const titleXFrac = clamp(titleOffsetX / 1280, 0, 1);
  const subtitleXFrac = clamp(subtitleOffsetX / 1280, 0, 1);
  const alertXFrac = clamp(alertOffsetX / 1280, 0, 1);

  const titleYInBlockFrac = clamp(titleOffsetY / Math.max(1, blockHeight), 0, 1);
  const subtitleYInBlockFrac = clamp(subtitleOffsetY / Math.max(1, blockHeight), 0, 1);
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
          onError={(e) => (((e.currentTarget as HTMLImageElement).style.display = "none"), undefined)}
        />
        <img
          src={ICON_FB}
          alt="Facebook"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="h-6 w-6 rounded-full bg-black/60 p-1"
          onError={(e) => (((e.currentTarget as HTMLImageElement).style.display = "none"), undefined)}
        />
        <img
          src={ICON_IG}
          alt="Instagram"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="h-6 w-6 rounded-full bg-black/60 p-1"
          onError={(e) => (((e.currentTarget as HTMLImageElement).style.display = "none"), undefined)}
        />
      </div>
    );
  }

  function OverlayLayer(props: { w: number; h: number; showHeader: boolean }) {
    const { w, h, showHeader } = props;

    const footerH = Math.round((FOOTER_HEIGHT / 720) * h);
    const headerH = showHeader ? Math.round((HEADER_STRIP_HEIGHT / 720) * h) : 0;
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
          <div className="absolute" style={{ left: horizLeft, top: horizTop, width: horizW, height: horizH }}>
            <ImgMulti
              candidates={LOGO_HORIZONTAL_CANDIDATES}
              alt="Logo horizontal (preview)"
              className="absolute inset-0 object-contain select-none"
              style={{ opacity: logoHorizontalOpacity }}
            />
          </div>
        )}

        {showLogoCircle && !showLogoHorizontal && (
          <div className="absolute" style={{ left: circleLeft, top: circleTop, width: circleW, height: circleW }}>
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
            <span className="font-semibold text-slate-200">{headerDate || "Fecha"}</span>
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
                  fontSize: `${Math.max(18, Math.round((titleSize / 1280) * w))}px`,
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
                  fontSize: `${Math.max(12, Math.round((subtitleSize / 1280) * w))}px`,
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

        {/* Footer fijo */}
        <div
          className="absolute inset-x-0 flex items-center justify-between gap-3 px-4"
          style={{
            bottom: 0,
            height: footerH,
            backgroundColor: themeColors.footerBg,
            borderTop: `1px solid ${themeColors.footerBorder}`,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={BRAND_LOCKUP_SRC}
              alt="Canalibertario lockup"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="h-7 w-7 flex-none rounded-full border border-white/10 bg-black/30 object-cover"
              onError={(e) => (((e.currentTarget as HTMLImageElement).style.display = "none"), undefined)}
            />
            <div className="min-w-0">
              <div className="truncate text-xs font-extrabold tracking-tight text-slate-100">CANALIBERTARIO</div>
              <div className="truncate text-[10px] text-slate-300">Noticias y análisis (mirada libertaria)</div>
            </div>
          </div>

          <div className="flex flex-none items-center gap-3">
            <div className="opacity-95" style={{ color: brandColor }}>
              <SocialIcons />
            </div>
            {footer.trim() ? <span className="text-[10px] text-slate-300">{footer.trim()}</span> : null}
          </div>
        </div>
      </>
    );
  }

  const overlayHeightPctUI = Math.round((blockHeight / Math.max(1, contentHeight)) * 100);

  // ✅ PROXY same-origin para evitar CORS al bajar una imagen del backend
  async function ensureFileFromPreviewUrl(): Promise<File | null> {
    if (!previewUrl) return null;

    try {
      if (previewUrl.startsWith("blob:")) {
        const res = await fetch(previewUrl);
        if (!res.ok) return null;
        const blob = await res.blob();
        const mime = blob.type || "image/jpeg";
        return new File([blob], "image-from-preview.jpg", { type: mime });
      }

      const qs = new URLSearchParams();
      qs.set("proxyUrl", previewUrl);

      const res = await fetch(`/api/editor-images/enhance?${qs.toString()}`, { method: "GET" });
      if (!res.ok) return null;

      const blob = await res.blob();
      const mime = blob.type || "image/jpeg";
      return new File([blob], "image-from-preview.jpg", { type: mime });
    } catch {
      return null;
    }
  }

  function toBackendPath(u: string) {
    if (!u) return "";
    try {
      if (u.startsWith("http://") || u.startsWith("https://")) return new URL(u).pathname;
    } catch { }
    return u; // ya es "/uploads/..." o "/brand/..."
  } 0

  const handleGenerate = async () => {
    if (!previewUrl && !file) {
      setErrorMsg("Primero seleccioná una imagen base (o usá la biblioteca).");
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

      if (!effectiveFile)
        throw new Error("No pude descargar la imagen base para enviar (proxy falló).");

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
            widthPct: useHorizontal ? logoHorizontalWidthPct : logoCircleWidthPct,
            opacity: useHorizontal ? logoHorizontalOpacity : logoCircleOpacity,
          }
          : { enabled: false };

      const brandConfig = {
        brandName: "CANALIBERTARIO",
        assets: {
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
          ? { date: headerDate || null, label: headerLabel || null }
          : null,

        footerLeft: { enabled: true, kind: "lockup" },
        logoOverlay,

        // ✅ NUEVO: overlays (banderas / símbolos / mapas / caras-circulares)
        // Espera que el backend implemente layout.imageOverlays en cover.renderer.ts
        imageOverlays: (assetOverlays ?? []).map((o) => ({
          path: toBackendPath(o.item.url),
          xPct: o.xPct, // % del CONTENT (x) == % del canvas en X
          yPct: contentYPctToCanvasYPct({
            yContentPct: o.yPct, // y está en % del content box
            showHeaderStrip,
          }),
          widthPct: o.widthPct, // % del ancho del content/canvas
          opacity: o.opacity ?? 1,
          label: o.label ?? null,
        })),
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
        data?.imageUrl ?? data?.coverUrl ?? data?.enhancedImageUrl ?? data?.url ?? null;

      if (!finalUrl) {
        const coverError = data?.coverError?.message ? ` (${data.coverError.message})` : "";
        throw new Error(`El backend no devolvió imageUrl/coverUrl${coverError}`);
      }

      setStatusMsg(data?.message ?? "Cover generada. URL copiada al portapapeles.");

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(finalUrl);
        } catch { }
      }

      if (typeof window !== "undefined" && window.opener && window.location) {
        try {
          window.opener.postMessage(
            { type: "editor-image-url", url: finalUrl },
            window.location.origin,
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


  // coords logo preview 16:9
  const previewW = previewRef.current?.getBoundingClientRect().width ?? 1280;
  const previewH = previewRef.current?.getBoundingClientRect().height ?? 720;
  const contentW = Math.max(1, previewW);
  const contentH = Math.max(1, previewH - previewHeaderH - previewFooterH);

  const circleLeft = pctToPx(logoCircleXPct, contentW);
  const circleTop = previewHeaderH + pctToPx(logoCircleYPct, contentH);
  const circleW = (logoCircleWidthPct / 100) * contentW;

  const horizLeft = pctToPx(logoHorizontalXPct, contentW);
  const horizTop = previewHeaderH + pctToPx(logoHorizontalYPct, contentH);
  const horizW = (logoHorizontalWidthPct / 100) * contentW;
  const horizH = horizW * 0.28;

  // layout columns: preview / controls / library
  return (
    <main className="fixed inset-0 z-[9999] overflow-auto bg-slate-950 text-slate-50">
      {/* ✅ full width real (sin “blanco” alrededor) */}
      <div className="w-screen px-4 py-6">
        {/* ✅ max ancho grande pero sin centrar “chico” */}
        <div className="mx-auto max-w-[2200px]">
          <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Editor de portadas · Full
              </div>
              <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
                Editá la portada con preview grande + controles + biblioteca.
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetPositions}
                className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-sky-400"
              >
                Reset todo
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={saving || (!previewUrl && !file)}
                className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_18px_35px_rgba(56,189,248,0.45)] hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-300"
              >
                {saving ? "Generando..." : "Generar cover"}
              </button>
            </div>
          </header>

          {statusMsg && (
            <div className="mb-3 rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-100">
              {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-3 rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
              {errorMsg}
            </div>
          )}

          {/* ✅ layout nuevo: CONTROLES (izq) / PREVIEW (centro) / BIBLIOTECA (der) */}
          <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)_360px] xl:grid-cols-[380px_minmax(0,1fr)_380px]">

            {/* =======================
            COL 1: CONTROLES (izq)
        ======================= */}
            <aside className="space-y-4 lg:sticky lg:top-4 lg:h-[calc(100vh-32px)] lg:overflow-auto">

              <button
                type="button"
                onClick={alignAllToGuideX}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-sky-400"
                title="Alinea título/etiqueta/logos/overlays a la X de la bajada"
              >
                Alinear X (a la bajada)
              </button>

              {/* Imagen base + branding */}
              <section className="mx-auto w-full max-w-[1100px] overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/60 shadow-[0_32px_90px_rgba(15,23,42,0.55)]">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Controles
                </h2>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-50 hover:border-sky-400/80 hover:bg-slate-800">
                    Subir imagen local
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={saving || (!previewUrl && !file)}
                    className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-300"
                  >
                    {saving ? "Generando..." : "Generar"}
                  </button>
                </div>

                {previewUrl && (
                  <p className="truncate text-[11px] text-slate-400">
                    Base:{" "}
                    <span className="font-mono text-slate-300">{previewUrl}</span>
                  </p>
                )}

                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Branding (logos flotantes)
                  </h3>

                  <div className="grid gap-2">
                    <label className="flex items-center gap-2 text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={showLogoCircle}
                        onChange={(e) => setShowLogoCircle(e.target.checked)}
                        className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                      />
                      Logo circular
                    </label>

                    <label className="flex items-center gap-2 text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={showLogoHorizontal}
                        onChange={(e) => setShowLogoHorizontal(e.target.checked)}
                        className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                      />
                      Logo horizontal
                    </label>
                  </div>

                  {(showLogoCircle || showLogoHorizontal) && (
                    <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-[11px] text-slate-200">
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
                          className="inline-flex w-full items-center justify-center rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
                        >
                          Reset logo flotante
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Textos */}
                <div className="space-y-3 border-t border-slate-800 pt-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Textos
                  </h3>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">
                      Título{" "}
                      <span className="ml-1 text-[10px] text-slate-500">
                        (Enter agrega salto)
                      </span>
                    </label>
                    <textarea
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      rows={3}
                      className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    />
                  </div>

                  {(() => {
                    const selected = assetOverlays.find((o) => o.id === selectedOverlayId) ?? null;
                    if (!selected) return null;

                    const isFaceCircle =
                      (selected.item.group ?? "").toLowerCase() === "caras-circulares" ||
                      (selected.item.relPath ?? "").toLowerCase().includes("caras-circulares");

                    if (!isFaceCircle) return null;

                    return (
                      <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Texto del círculo
                        </div>

                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-300">Nombre</label>
                            <input
                              value={selected.label?.line1 ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setAssetOverlays((prev) =>
                                  prev.map((o) =>
                                    o.id === selected.id
                                      ? { ...o, label: { ...(o.label ?? {}), line1: v } }
                                      : o,
                                  ),
                                );
                              }}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none focus:border-sky-400"
                              placeholder="JAVIER MILEI"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-300">Cargo</label>
                            <input
                              value={selected.label?.line2 ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setAssetOverlays((prev) =>
                                  prev.map((o) =>
                                    o.id === selected.id
                                      ? { ...o, label: { ...(o.label ?? {}), line2: v } }
                                      : o,
                                  ),
                                );
                              }}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none focus:border-sky-400"
                              placeholder="PRESIDENTE ARGENTINO"
                            />
                          </div>
                        </div>
                      </section>
                    );
                  })()}


                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">
                      Bajada{" "}
                      <span className="ml-1 text-[10px] text-slate-500">
                        (acepta saltos)
                      </span>
                    </label>
                    <textarea
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      rows={2}
                      className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={showHeaderStrip}
                        onChange={(e) => setShowHeaderStrip(e.target.checked)}
                        className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                      />
                      Franja superior
                    </label>

                    {showHeaderStrip && (
                      <div className="grid gap-2">
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
                          placeholder="ECONOMÍA / POLÍTICA"
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">
                      Footer{" "}
                      <span className="ml-1 text-[10px] text-slate-500">
                        (sin URL)
                      </span>
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
                    <label className="text-[11px] text-slate-300">Etiqueta</label>
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

                  <div className="space-y-3 border-t border-slate-800 pt-3 text-[11px] text-slate-300">
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
                        <span>Altura del fondo</span>
                        <span className="text-slate-400">{overlayHeightPctUI}%</span>
                      </div>
                      <input
                        type="range"
                        min={25}
                        max={65}
                        value={overlayHeightPctUI}
                        onChange={(e) => {
                          const pct = Number(e.target.value);

                          // mismo contentHeight que ya usás
                          const newH = Math.round((pct / 100) * Math.max(1, contentHeight));
                          setBlockHeight(newH);

                          // ✅ re-clamp top para que no pueda quedar afuera
                          const minTop = contentTopOffset; // si querés, +0 (sin margen)
                          const maxTop = contentTopOffset + contentHeight - newH;
                          setBlockTop((prev) => Math.min(maxTop, Math.max(minTop, prev)));
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

              {/* Resumen */}
              <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-950/90 p-5 text-[11px]">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Resumen
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
                      ? `${headerDate || "sin fecha"} · ${headerLabel || "sin etiqueta"}`
                      : "desactivada"}
                  </div>
                  <div>
                    <b>Footer:</b> {footer.trim() || "(vacío)"}{" "}
                    <span className="text-slate-500">(sin URL)</span>
                  </div>
                  <div>
                    <b>Tema:</b> {themeLabel(theme)}
                  </div>
                  <div>
                    <b>% backend:</b> top {blockTopPct.toFixed(1)}% · alto{" "}
                    {overlayHeightPct.toFixed(1)}%
                  </div>
                  <div className="text-slate-500">
                    (posición se define arrastrando en la preview)
                  </div>
                </div>
              </section>
            </aside>

            {/* =======================
            COL 2: PREVIEW (centro)
        ======================= */}
            <section className="overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/60 shadow-[0_32px_90px_rgba(15,23,42,0.55)]">
              <div className="flex items-center justify-between px-6 pt-4 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                <span>Vista previa 16:9</span>
                <span>Base ideal para X / Facebook / YouTube</span>
              </div>

              {/* ✅ wrapper para que el preview crezca y use el alto de pantalla */}
              <div className="px-6 pb-6">
                <div
                  ref={previewRef}
                  className="relative mt-3 w-full overflow-hidden rounded-2xl border border-slate-800 bg-black/60"
                  style={{
                    aspectRatio: "16 / 9",
                    maxHeight: "calc(100vh - 220px)",
                  }}
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

                      {assetOverlays.map((ov) => {
                        const left = pctToPx(ov.xPct, contentW);
                        const top = previewHeaderH + pctToPx(ov.yPct, contentH);
                        const w = (ov.widthPct / 100) * contentW;
                        const h = w * 0.66;

                        return (
                          <div
                            key={ov.id}
                            className="absolute cursor-move"
                            style={{
                              left,
                              top,
                              width: w,
                              height: h,
                              zIndex: 25,
                              background: "rgba(0,0,0,0.12)",
                              border: selectedOverlayId === ov.id
                                ? "2px solid rgba(56,189,248,0.9)"
                                : "1px solid rgba(255,255,255,0.18)",
                              borderRadius: 14,
                              backdropFilter: "blur(1px)",
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedOverlayId(ov.id);
                              setDrag({
                                target: "asset",
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

                                assetId: ov.id,
                                assetXPct: ov.xPct,
                                assetYPct: ov.yPct,
                                assetWidthPct: ov.widthPct,
                              });
                            }}
                            title={ov.item.relPath}
                          >
                            <img
                              src={abs(ov.item.url)}
                              alt={ov.item.filename}
                              className="absolute inset-0 h-full w-full select-none object-contain"
                              style={{ opacity: ov.opacity, pointerEvents: "none" }}
                              draggable={false}
                              onDragStart={(e) => e.preventDefault()}
                            />
                            {(ov.label?.line1 || ov.label?.line2) ? (
                              <div
                                className="absolute left-2 right-2"
                                style={{
                                  top: "100%",
                                  marginTop: 8,
                                  padding: "8px 10px",
                                  borderRadius: 12,
                                  background: "rgba(0,0,0,0.40)",
                                  border: "1px solid rgba(255,255,255,0.18)",
                                  backdropFilter: "blur(2px)",
                                }}
                              >
                                {ov.label?.line1 ? (
                                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-white">
                                    {ov.label.line1}
                                  </div>
                                ) : null}
                                {ov.label?.line2 ? (
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                                    {ov.label.line2}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            <div
                              className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border border-white/30 bg-black/60 shadow"
                              title="Redimensionar overlay"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDrag((prev) =>
                                  prev && prev.assetId === ov.id
                                    ? { ...prev, target: "assetResize" }
                                    : {
                                      target: "assetResize",
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

                                      assetId: ov.id,
                                      assetXPct: ov.xPct,
                                      assetYPct: ov.yPct,
                                      assetWidthPct: ov.widthPct,
                                    },
                                );
                              }}
                            />

                            <button
                              type="button"
                              className="absolute -top-2 -right-2 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] text-white/80 hover:bg-black/80"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                setAssetOverlays((prev) => prev.filter((x) => x.id !== ov.id));

                                // ✅ si era el seleccionado, limpiar selección
                                setSelectedOverlayId((cur) => (cur === ov.id ? null : cur));
                              }}
                              title="Quitar overlay"
                            >
                              ×
                            </button>

                          </div>
                        );
                      })}

                      {/* LOGO H */}
                      {showLogoHorizontal && (
                        <div
                          className="absolute cursor-move"
                          style={{
                            left: horizLeft,
                            top: horizTop,
                            width: horizW,
                            height: horizH,
                            zIndex: 30,
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
                            style={{
                              opacity: logoHorizontalOpacity,
                              pointerEvents: "none",
                            }}
                          />
                          <div
                            className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border border-white/30 bg-black/60 shadow"
                            title="Redimensionar"
                            onMouseDown={(e) => startDrag("logoHorizontalResize", e)}
                          />
                        </div>
                      )}

                      {/* LOGO CIRCLE */}
                      {showLogoCircle && !showLogoHorizontal && (
                        <div
                          className="absolute cursor-move rounded-full"
                          style={{
                            left: circleLeft,
                            top: circleTop,
                            width: circleW,
                            height: circleW,
                            zIndex: 30,
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
                            style={{
                              opacity: logoCircleOpacity,
                              pointerEvents: "none",
                            }}
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
                          borderTop: "2px solid rgba(255,255,255,0.28)",
                          boxShadow: "0 -2px 14px rgba(0,0,0,0.35)",
                          backdropFilter: "blur(1px)"
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

                      {/* FOOTER FIJO */}
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
                        : "No hay imagen base. Seleccioná una imagen o usá la biblioteca."}
                    </div>
                  )}
                </div>
              </div>

              {/* THEME + COLORS (debajo del preview) */}
              <div className="border-t border-slate-800 bg-slate-950/70 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Tema y colores
                  </h2>
                  <label className="flex items-center gap-2 text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={showSocialPreviews}
                      onChange={(e) => setShowSocialPreviews(e.target.checked)}
                      className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                    />
                    Mostrar previews recorte
                  </label>
                </div>

                <div className="mt-3 space-y-3 text-[11px]">
                  <div className="space-y-2">
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
                        ),
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-300">Título</span>
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
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-300">Bajada</span>
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
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-300">Iconos</span>
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
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={resetPositions}
                      className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:border-sky-400"
                    >
                      Reset posiciones
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* =======================
            COL 3: BIBLIOTECA (der)
        ======================= */}
            <aside className="space-y-4 lg:sticky lg:top-4 lg:h-[calc(100vh-32px)] lg:overflow-auto">
              <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-950/90 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Biblioteca
                  </h2>
                  <button
                    type="button"
                    onClick={() => setLibOpen((v) => !v)}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-100"
                  >
                    {libOpen ? "Cerrar" : "Abrir"}
                  </button>
                </div>

                {libOpen && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={libScope}
                        onChange={(e) => setLibScope(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50"
                      >
                        <option value="raw">RAW</option>
                        <option value="covers">Covers</option>
                        <option value="screens">Screens</option>
                        <option value="all">All</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => void fetchLibrary()}
                        disabled={libBusy}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                      >
                        {libBusy ? "Cargando..." : "Refrescar"}
                      </button>
                    </div>

                    {/* Quick selectors */}
                    <div className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-[11px]">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Selectores rápidos
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setLibSelectMode("base")}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold ${libSelectMode === "base"
                            ? "bg-sky-500 text-slate-950"
                            : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                            }`}
                        >
                          Seleccionar como base
                        </button>

                        <button
                          type="button"
                          onClick={() => setLibSelectMode("overlay")}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold ${libSelectMode === "overlay"
                            ? "bg-sky-500 text-slate-950"
                            : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                            }`}
                        >
                          Agregar como overlay
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={libCategory}
                          onChange={(e) => setLibCategory(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50"
                        >
                          <option value="">(category)</option>
                          {libCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>

                        <select
                          value={libGroup}
                          onChange={(e) => setLibGroup(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50"
                        >
                          <option value="">(group)</option>
                          {libGroups.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={libCategory === "personas" ? libGroup : ""}
                          onChange={(e) => quickPeopleSelect(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50"
                        >
                          <option value="">Personas (grupo)</option>
                          {peopleGroups.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>

                        <select
                          value={assetsCategories.includes(libCategory) ? libCategory : ""}
                          onChange={(e) => quickAssetsSelect(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50"
                        >
                          <option value="">Assets (cat)</option>
                          {assetsCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={clearLibraryFilters}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-sky-400"
                      >
                        Limpiar filtros
                      </button>
                    </div>

                    <input
                      value={libQ}
                      onChange={(e) => setLibQ(e.target.value)}
                      placeholder="Buscar (milei, trump, dolar, bandera...)"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void fetchLibrary()}
                        disabled={libBusy}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                      >
                        {libBusy ? "Buscando..." : "Buscar"}
                      </button>

                      <span className="text-[11px] text-slate-500">
                        {libItems.length ? `${libItems.length} items` : "—"}
                      </span>
                    </div>

                    {libErr && (
                      <div className="rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                        {libErr}
                      </div>
                    )}

                    <div className="grid max-h-[640px] grid-cols-2 gap-2 overflow-auto rounded-2xl border border-slate-900 bg-black/20 p-2">
                      {libItems.map((it) => {
                        const thumb = abs(it.url);
                        return (
                          <button
                            key={`${it.scope}:${it.relPath}`}
                            type="button"
                            onClick={() =>
                              libSelectMode === "base"
                                ? selectBaseFromLibrary(it)
                                : addOverlayFromLibrary(it)
                            }
                            className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 text-left hover:border-sky-500"
                            title={it.relPath}
                          >
                            <div className="aspect-[4/3] w-full overflow-hidden bg-black/40">
                              <img
                                src={thumb}
                                alt={it.filename}
                                className="h-full w-full object-cover opacity-90 group-hover:opacity-100"
                                loading="lazy"
                              />
                            </div>
                            <div className="p-2">
                              <div className="truncate text-[11px] font-semibold text-slate-100">
                                {it.filename}
                              </div>
                              <div className="truncate text-[10px] text-slate-400">
                                {it.category ?? "—"}/{it.group ?? "—"} ·{" "}
                                {bytesToHuman(it.bytes)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-slate-500">
                      Seleccionás una imagen → queda como base. Al generar, se baja por
                      proxy (sin CORS).
                    </div>
                  </>
                )}
              </section>

              {/* Social previews (opcional) */}
              {/*    {showSocialPreviews && previewUrl ? (
                <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-950/70 p-5">

                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Previews recorte (imágenes)
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      Visual (backend genera final)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-300">
                        16:9
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-slate-300">
                          1:1
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
                          4:5
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
                  </div>
                </section>
              ) : null} */}
            </aside>
          </div>
        </div>
      </div>
    </main>

  );
}
