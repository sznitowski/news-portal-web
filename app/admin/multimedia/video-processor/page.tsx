"use client";

import { useMemo, useState } from "react";

type UploadRes = { relPath: string; url: string; bytes: number };
type NormalizeRes = { outputRelPath: string; outputUrl: string };
type RenderRes = Partial<{ web_16x9: string; feed_4x5: string; reel_9x16: string }>;

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("news_access_token");
}

export default function VideoProcessorPage() {
  const [file, setFile] = useState<File | null>(null);

  const [uploadRes, setUploadRes] = useState<UploadRes | null>(null);
  const [normRes, setNormRes] = useState<NormalizeRes | null>(null);
  const [renderRes, setRenderRes] = useState<RenderRes | null>(null);

  const [startSec, setStartSec] = useState(0);
  const [durationSec, setDurationSec] = useState(6);
  const [text, setText] = useState("BATCH");
  const [mode, setMode] = useState<"cover" | "contain_blur">("cover");

  const [presets, setPresets] = useState({
    web_16x9: true,
    feed_4x5: true,
    reel_9x16: true,
  });

  const [busy, setBusy] = useState<null | "upload" | "normalize" | "render" | "pipeline">(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedPresets = useMemo(() => {
    const p: string[] = [];
    if (presets.web_16x9) p.push("web_16x9");
    if (presets.feed_4x5) p.push("feed_4x5");
    if (presets.reel_9x16) p.push("reel_9x16");
    return p;
  }, [presets]);

  // ✅ Assets viven en el backend (5001), no en 3001
  const ASSET_BASE = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5001";
  }, []);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1200);
  };

  const abs = (maybePath: string) => {
    if (!maybePath) return "";
    if (maybePath.startsWith("http://") || maybePath.startsWith("https://")) return maybePath;
    if (maybePath.startsWith("/")) return `${ASSET_BASE}${maybePath}`;
    return `${ASSET_BASE}/${maybePath}`;
  };

  async function upload(): Promise<UploadRes | null> {
    setErr(null);
    setUploadRes(null);
    setNormRes(null);
    setRenderRes(null);

    const token = getToken();
    if (!token) {
      setErr("No hay token. Volvé a iniciar sesión.");
      return null;
    }
    if (!file) {
      setErr("Elegí un .mp4 primero.");
      return null;
    }

    setBusy("upload");
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/uploads/video", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const raw = await res.text().catch(() => "");
      const json = raw ? JSON.parse(raw) : null;

      if (!res.ok) {
        setErr(json?.message ?? `Upload falló (${res.status})`);
        return null;
      }

      setUploadRes(json as UploadRes);
      return json as UploadRes;
    } catch (e: any) {
      setErr(e?.message ?? "Error inesperado en upload");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function normalize(inputRelPath: string): Promise<NormalizeRes | null> {
    setErr(null);
    setNormRes(null);
    setRenderRes(null);

    setBusy("normalize");
    try {
      const res = await fetch("/api/admin/video/normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputRelPath }),
      });

      const raw = await res.text().catch(() => "");
      const json = raw ? JSON.parse(raw) : null;

      if (!res.ok) {
        setErr(json?.message ?? `Normalize falló (${res.status})`);
        return null;
      }

      setNormRes(json as NormalizeRes);
      return json as NormalizeRes;
    } catch (e: any) {
      setErr(e?.message ?? "Error inesperado en normalize");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function renderBatch(inputRelPath: string): Promise<RenderRes | null> {
    setErr(null);
    setRenderRes(null);

    if (selectedPresets.length === 0) {
      setErr("Elegí al menos 1 preset.");
      return null;
    }

    setBusy("render");
    try {
      const payload = {
        inputRelPath,
        startSec,
        durationSec,
        text,
        mode,
        presets: selectedPresets,
        outputDir: "video/processed",
        namePrefix: "multi",
      };

      const res = await fetch("/api/admin/video/render-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text().catch(() => "");
      const json = raw ? JSON.parse(raw) : null;

      if (!res.ok) {
        setErr(json?.message ?? `Render-batch falló (${res.status})`);
        return null;
      }

      setRenderRes(json as RenderRes);
      return json as RenderRes;
    } catch (e: any) {
      setErr(e?.message ?? "Error inesperado en render-batch");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function runAll() {
    setErr(null);
    setBusy("pipeline");
    try {
      let rel = uploadRes?.relPath ?? null;

      if (!rel) {
        const up = await upload(); 
        rel = up?.relPath ?? null;
      }

      if (!rel) {
        setErr((prev) => prev ?? "No pude obtener relPath del upload.");
        return;
      }

      const n = await normalize(rel);
      if (!n?.outputRelPath) return;

      await renderBatch(n.outputRelPath);
    } finally {
      setBusy(null);
    }
  }


  const outputs = useMemo(() => {
    if (!renderRes) return [];
    const list: Array<{ key: string; url: string }> = [];
    if (renderRes.web_16x9) list.push({ key: "web_16x9", url: renderRes.web_16x9 });
    if (renderRes.feed_4x5) list.push({ key: "feed_4x5", url: renderRes.feed_4x5 });
    if (renderRes.reel_9x16) list.push({ key: "reel_9x16", url: renderRes.reel_9x16 });
    return list;
  }, [renderRes]);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-10 pb-16">
      <h1 className="text-xl font-semibold text-slate-900">Procesador de videos</h1>
      <p className="mt-1 text-sm text-slate-600">Subí un MP4, normalizalo y generá salidas web/feed/reel.</p>

      {toast && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {toast}
        </div>
      )}

      {err && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Video (.mp4)</label>
            <input
              type="file"
              accept="video/mp4"
              className="mt-2 block w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="mt-1 text-xs text-slate-500">
              Se sube vía <code>/api/uploads/video</code>.
            </div>
          </div>

          <button
            type="button"
            onClick={() => void upload()}
            disabled={!!busy}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "upload" ? "Subiendo..." : "Subir"}
          </button>
        </div>

        {uploadRes && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="font-semibold text-slate-900">Upload OK</div>

            <div className="mt-1 text-xs text-slate-600">
              relPath: <code>{uploadRes.relPath}</code>
            </div>

            <div className="mt-1 text-xs text-slate-600">
              URL:{" "}
              <a className="underline" href={abs(uploadRes.url)} target="_blank" rel="noreferrer">
                {uploadRes.url}
              </a>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void normalize(uploadRes.relPath)}
                disabled={!!busy}
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-200 disabled:opacity-60"
              >
                {busy === "normalize" ? "Normalizando..." : "Normalize"}
              </button>

              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(uploadRes.relPath);
                  showToast("Copiado: relPath");
                }}
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-200"
              >
                Copiar relPath
              </button>
            </div>
          </div>
        )}

        {normRes && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="font-semibold text-slate-900">Normalize OK</div>

            <div className="mt-1 text-xs text-slate-600">
              outputRelPath: <code>{normRes.outputRelPath}</code>
            </div>

            <div className="mt-1 text-xs text-slate-600">
              URL:{" "}
              <a className="underline" href={abs(normRes.outputUrl)} target="_blank" rel="noreferrer">
                {normRes.outputUrl}
              </a>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Parámetros</div>

                <div className="mt-2 grid gap-2">
                  <label className="text-xs text-slate-700">
                    startSec
                    <input
                      type="number"
                      value={startSec}
                      min={0}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      onChange={(e) => setStartSec(Number(e.target.value))}
                    />
                  </label>

                  <label className="text-xs text-slate-700">
                    durationSec
                    <input
                      type="number"
                      value={durationSec}
                      min={1}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      onChange={(e) => setDurationSec(Number(e.target.value))}
                    />
                  </label>

                  <label className="text-xs text-slate-700">
                    text
                    <input
                      type="text"
                      value={text}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      onChange={(e) => setText(e.target.value)}
                    />
                  </label>

                  <label className="text-xs text-slate-700">
                    mode
                    <select
                      value={mode}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      onChange={(e) => setMode(e.target.value as any)}
                    >
                      <option value="cover">cover</option>
                      <option value="contain_blur">contain_blur</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Presets</div>

                <div className="mt-2 grid gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={presets.web_16x9}
                      onChange={(e) => setPresets((p) => ({ ...p, web_16x9: e.target.checked }))}
                    />
                    web_16x9
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={presets.feed_4x5}
                      onChange={(e) => setPresets((p) => ({ ...p, feed_4x5: e.target.checked }))}
                    />
                    feed_4x5
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={presets.reel_9x16}
                      onChange={(e) => setPresets((p) => ({ ...p, reel_9x16: e.target.checked }))}
                    />
                    reel_9x16
                  </label>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void renderBatch(normRes.outputRelPath)}
                    disabled={!!busy}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {busy === "render" ? "Renderizando..." : "Render batch"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderRes && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="font-semibold text-slate-900">Render OK</div>

            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {outputs.map((o) => {
                const urlAbs = abs(o.url);
                return (
                  <div key={o.key} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">{o.key}</div>

                    <video controls preload="metadata" className="mt-2 w-full rounded-lg border border-slate-200">
                      <source src={urlAbs} type="video/mp4" />
                    </video>

                    <div className="mt-2 break-all text-[11px] text-slate-600">
                      <a className="underline" href={urlAbs} target="_blank" rel="noreferrer">
                        {o.url}
                      </a>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(urlAbs);
                          showToast("Copiado: URL");
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900"
                      >
                        Copiar URL
                      </button>
                      <a
                        href={urlAbs}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900"
                      >
                        Abrir
                      </a>
                      <a
                        href={urlAbs}
                        download
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900"
                      >
                        Descargar
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runAll()}
            disabled={!!busy}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "pipeline" ? "Ejecutando..." : "Pipeline completo (upload → normalize → render)"}
          </button>
        </div>
      </div>
    </main>
  );
}
