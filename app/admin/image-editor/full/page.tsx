// app/admin/image-editor/full/page.tsx
"use client";

import {
  useState,
  useEffect,
  useRef,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useSearchParams } from "next/navigation";

type DragTarget = "block" | "title" | "subtitle" | "handle" | "resize" | null;
type TextPosition = "top" | "middle" | "bottom";

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
  handleOffsetX: number;
  handleOffsetY: number;
};

const TITLE_COLORS = ["#ffffff", "#22c55e", "#0ea5e9", "#f97316", "#ef4444"];
const SUBTITLE_COLORS = ["#e5e7eb", "#bae6fd", "#fef9c3", "#e5e5e5", "#93c5fd"];
const BRAND_COLORS = ["#ffffff", "#22c55e", "#0ea5e9", "#f97316", "#ef4444"];

export default function ImageEditorFullPage() {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Imagen base
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Textos
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [footer, setFooter] = useState("www.canalibertario.com");
  const [alertTag, setAlertTag] = useState("");

  // Colores
  const [titleColor, setTitleColor] = useState("#22c55e");
  const [subtitleColor, setSubtitleColor] = useState("#e5e7eb");
  const [brandColor, setBrandColor] = useState("#ffffff");

  // Tamaños de fuente (solo preview)
  const [titleSize, setTitleSize] = useState(40); // px
  const [subtitleSize, setSubtitleSize] = useState(22); // px

  // Posición del bloque
  const [blockTop, setBlockTop] = useState(260);
  const [blockHeight, setBlockHeight] = useState(130);

  // Guardamos posición inicial para poder calcular el offset
  const [initialBlockTop, setInitialBlockTop] = useState(260);
  const [textPosition, setTextPosition] = useState<TextPosition>("bottom");

  // Offsets internos
  const [titleOffsetX, setTitleOffsetX] = useState(40);
  const [titleOffsetY, setTitleOffsetY] = useState(30);

  const [subtitleOffsetX, setSubtitleOffsetX] = useState(40);
  const [subtitleOffsetY, setSubtitleOffsetY] = useState(80);

  const [handleOffsetX, setHandleOffsetX] = useState(40);
  const [handleOffsetY, setHandleOffsetY] = useState(30);

  // Drag
  const [drag, setDrag] = useState<DragState | null>(null);

  // Estado general
  const [loadingImage, setLoadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==========================
  // INIT DESDE QUERY STRING
  // ==========================
  useEffect(() => {
    const imageUrl = searchParams.get("imageUrl");
    const initialTitle = searchParams.get("title") ?? "";
    const initialSubtitle = searchParams.get("subtitle") ?? "";
    const initialFooter =
      searchParams.get("footer") ?? "www.canalibertario.com";
    const initialAlert = searchParams.get("alertTag") ?? "";

    setTitle(initialTitle);
    setSubtitle(initialSubtitle);
    setFooter(initialFooter);
    setAlertTag(initialAlert);

    const textPosParam = searchParams.get("textPosition") as TextPosition | null;

    let pos: TextPosition = "bottom";
    let startTop = 260;

    if (textPosParam === "top") {
      pos = "top";
      startTop = 80;
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
          err?.message ?? "No se pudo cargar la imagen inicial para editar."
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
  const startDrag = (
    target: DragTarget,
    e: ReactMouseEvent<HTMLDivElement | HTMLSpanElement>
  ) => {
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
      handleOffsetX,
      handleOffsetY,
    });
  };

  useEffect(() => {
    if (!drag) return;

    const handleMove = (ev: MouseEvent) => {
      if (!drag) return;
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;

      switch (drag.target) {
        case "block": {
          const minTop = 40;
          const maxTop = 340;
          const newTop = drag.blockTop + dy;
          setBlockTop(Math.min(maxTop, Math.max(minTop, newTop)));
          break;
        }
        case "resize": {
          const minHeight = 90;
          const maxHeight = 220;
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
        case "handle": {
          setHandleOffsetX(drag.handleOffsetX - dx);
          setHandleOffsetY(drag.handleOffsetY - dy);
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
  }, [drag]);

  // ==========================
  // RESET POSITIONS
  // ==========================
  function resetPositions() {
    setBlockTop(initialBlockTop);
    setBlockHeight(130);

    setTitleOffsetX(40);
    setTitleOffsetY(30);

    setSubtitleOffsetX(40);
    setSubtitleOffsetY(80);

    setHandleOffsetX(40);
    setHandleOffsetY(30);
  }

  // ==========================
  // GENERAR COVER (BACKEND)
  // ==========================
  const handleGenerate = async () => {
    if (!file) {
      setErrorMsg(
        "Primero seleccioná una imagen base (o asegurate que se haya cargado la del artículo)."
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

      const safeFooter = footer.trim() || "www.canalibertario.com";

      const brandConfig = {
        brandName: "CANALIBERTARIO",
        claim:
          "NOTICIAS Y ANÁLISIS ECONÓMICOS Y POLÍTICOS DESDE UNA MIRADA LIBERTARIA",
        useHeaderWordmark: true,
        siteUrl: safeFooter,
        socialHandle: "@canalibertario",
        socialIcons: ["x", "facebook", "instagram"] as const,
      };

      // offset relativo que espera el backend
      const layout = {
        textPosition,
        textOffsetY: blockTop - initialBlockTop,
      };

      const colors = {
        title: titleColor,
        subtitle: subtitleColor,
        handle: brandColor,
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
        throw new Error(
          text || `Error HTTP ${res.status} al generar la portada`
        );
      }

      const data = await res.json();
      setStatusMsg(
        data?.message ??
          "Imagen procesada correctamente. Se generó una portada (cover) lista para usar."
      );
    } catch (err: any) {
      console.error("[editor-full] error:", err);
      setErrorMsg(err?.message ?? "Error al generar la portada con IA.");
    } finally {
      setSaving(false);
    }
  };

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
              <span>Recomendado para X / Facebook / Instagram (1280x720 aprox.)</span>
            </div>

            <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-800 bg-black/60">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Imagen base"
                    className="h-full w-full object-cover"
                  />

                  {/* BLOQUE OSCURO */}
                  <div
                    className="absolute left-0 right-0 cursor-move bg-gradient-to-r from-black/85 via-black/80 to-black/70"
                    style={{
                      top: blockTop,
                      height: blockHeight,
                    }}
                    onMouseDown={(e) => startDrag("block", e)}
                  >
                    <div className="relative h-full w-full">
                      {/* TÍTULO */}
                      <span
                        className="absolute cursor-move select-none font-extrabold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                        style={{
                          left: titleOffsetX,
                          top: titleOffsetY,
                          fontSize: `${titleSize}px`,
                          color: titleColor,
                        }}
                        onMouseDown={(e) => startDrag("title", e)}
                      >
                        {title || "Título de ejemplo"}
                      </span>

                      {/* BAJADA */}
                      <span
                        className="absolute max-w-[60%] cursor-move select-none font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
                        style={{
                          left: subtitleOffsetX,
                          top: subtitleOffsetY,
                          fontSize: `${subtitleSize}px`,
                          color: subtitleColor,
                        }}
                        onMouseDown={(e) => startDrag("subtitle", e)}
                      >
                        {subtitle || "Bajada / descripción corta de ejemplo"}
                      </span>

                      {/* HANDLE + ICONOS */}
                      <div
                        className="absolute flex cursor-move select-none items-center gap-3 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
                        style={{
                          right: handleOffsetX,
                          bottom: handleOffsetY,
                          color: brandColor,
                        }}
                        onMouseDown={(e) => startDrag("handle", e)}
                      >
                        <span className="text-lg font-extrabold">
                          @canalibertario
                        </span>
                        <div className="flex items-center gap-2 text-xs">
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

                      {/* HANDLE ALTURA BLOQUE */}
                      <div
                        className="absolute bottom-2 left-[10%] right-[10%] h-1.5 cursor-ns-resize rounded-full bg-slate-200/80"
                        onMouseDown={(e) => startDrag("resize", e)}
                      />
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
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Colores
              </h2>

              <div className="space-y-3 text-[11px]">
                {/* COLOR TÍTULO */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-28 text-slate-300">Color título</span>
                  <div className="flex items-center gap-1">
                    {TITLE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTitleColor(c)}
                        className={`h-5 w-5 rounded-full border ${
                          titleColor === c
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
                  <span className="w-28 text-slate-300">Color bajada</span>
                  <div className="flex items-center gap-1">
                    {SUBTITLE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSubtitleColor(c)}
                        className={`h-5 w-5 rounded-full border ${
                          subtitleColor === c
                            ? "border-sky-400 ring-2 ring-sky-400/60"
                            : "border-slate-600"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-slate-400">
                    {subtitleColor}
                  </span>
                </div>

                {/* COLOR BRAND */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-28 text-slate-300">
                    Color @canalibertario + iconos
                  </span>
                  <div className="flex items-center gap-1">
                    {BRAND_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBrandColor(c)}
                        className={`h-5 w-5 rounded-full border ${
                          brandColor === c
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

                <p className="mt-1 text-[10px] text-slate-400">
                  Tip: arrastrá el bloque oscuro y cada texto directamente sobre
                  la imagen para reposicionarlos. El borde inferior del bloque
                  ajusta la altura.
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
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">
                  Bajada / descripción
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Sitio / firma</label>
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
                  onChange={(e) => setAlertTag(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                >
                  <option value="">Sin etiqueta</option>
                  <option value="URGENTE">URGENTE</option>
                  <option value="ALERTA">ALERTA</option>
                  <option value="ÚLTIMA HORA">ÚLTIMA HORA</option>
                </select>
              </div>

              {/* SLIDERS TAMAÑO TEXTO (solo preview) */}
              <div className="mt-3 space-y-3 border-t border-slate-800 pt-3 text-[11px] text-slate-300">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span>Tamaño título</span>
                    <span className="text-slate-400">{titleSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={28}
                    max={54}
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
                <b>Etiqueta:</b> {alertTag || "(sin)"}
              </div>
              <div>
                <b>Firma:</b>{" "}
                {(footer || "www.canalibertario.com") +
                  " + X / Facebook / Instagram"}
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
