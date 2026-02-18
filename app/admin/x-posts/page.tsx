"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type XInboxStatus = "new" | "queued" | "processed" | "discarded" | "all";

type XInboxItem = {
  id: number | string;
  externalId: string;
  permalinkUrl: string | null;
  text: string | null;

  createdTime: string | null;

  sourceName: string | null;
  sourceHandle: string | null;
  sourceUrl: string | null;

  status: "new" | "queued" | "processed" | "discarded";
  metaJson?: any | null;

  createdAt?: string;
  updatedAt?: string;
};

type XInboxResponse = {
  items: XInboxItem[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function safeJson(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

export default function XInboxPage() {
  const router = useRouter();

  const [status, setStatus] = useState<XInboxStatus>("new");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(30);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<XInboxResponse | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    if (status !== "all") p.set("status", status);
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [page, limit, status, q]);

  async function load() {
    setBusy(true);
    setErr(null);
    try {
      // ✅ este endpoint tiene que existir en tu Next api route:
      // GET /api/internal/x-posts?...  (proxy a Nest /internal/x-inbox o lo que definiste)
      const res = await fetch(`/api/internal/x-inbox?${qs}`, { method: "GET" });
      const json = await safeJson(res);

      if (!res.ok) {
        const msg =
          (json && typeof json === "object" && "message" in json && (json as any).message) ||
          `Error (${res.status})`;
        throw new Error(msg);
      }

      // tolerante: {items, meta} o {items} o array
      if (Array.isArray(json)) setData({ items: json as XInboxItem[] });
      else setData((json as XInboxResponse) ?? { items: [] });
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando inbox X");
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  async function setItemStatus(
    id: number | string,
    action: "queue" | "discard" | "processed",
  ) {
    try {
      setBusy(true);
      setErr(null);

      // ✅ PATCH a tu proxy:
      // PATCH /api/internal/x-posts/:id/:action
      const res = await fetch(`/api/internal/x-inbox/${id}/${action}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await safeJson(res);
      if (!res.ok) {
        const msg =
          (json && typeof json === "object" && "message" in json && (json as any).message) ||
          `Error (${res.status})`;
        throw new Error(msg);
      }

      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Error actualizando estado");
    } finally {
      setBusy(false);
    }
  }

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="rounded-3xl border border-slate-900 bg-slate-950/95 p-5 text-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.55)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/50 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
              Panel X Inbox
            </div>
            <h1 className="mt-2 text-2xl font-semibold">X · Bandeja</h1>
            <p className="mt-1 text-sm text-slate-300">
              Tweets detectados para procesar con IA (sin scrapear X: se manda el texto).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold hover:border-sky-400"
              disabled={busy}
            >
              {busy ? "Actualizando..." : "Refrescar"}
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            {err}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="text-[11px] text-slate-300">Status</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as XInboxStatus);
              }}
            >
              <option value="new">new</option>
              <option value="queued">queued</option>
              <option value="processed">processed</option>
              <option value="discarded">discarded</option>
              <option value="all">all</option>
            </select>
          </div>

          <div className="md:col-span-9">
            <label className="text-[11px] text-slate-300">Buscar</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-400"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="fuente, handle, texto, tweet id..."
            />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <div className="grid grid-cols-[120px_1fr_180px_140px_240px] gap-0 border-b border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            <div>Fuente</div>
            <div>Texto</div>
            <div>Fecha</div>
            <div>Status</div>
            <div>Acciones</div>
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">
              {busy ? "Cargando..." : "No hay items con esos filtros."}
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {items.map((it) => {
                const idNum = typeof it.id === "string" ? Number(it.id) : it.id;
                const inboxId = Number.isFinite(idNum) ? String(idNum) : String(it.id);

                const sourceLabel =
                  it.sourceHandle || it.sourceName || (it.sourceUrl ? "X" : "—");

                const dt = it.createdTime ?? it.createdAt ?? null;

                return (
                  <div
                    key={String(it.id)}
                    className="grid grid-cols-[120px_1fr_180px_140px_240px] items-start gap-0 px-3 py-3"
                  >
                    {/* 1) Fuente */}
                    <div className="text-xs text-slate-200 truncate" title={sourceLabel}>
                      {sourceLabel}
                    </div>

                    {/* 2) Texto: ✅ click redirige a from-image-ai */}
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          const p = new URLSearchParams();

                          // ✅ identify X inbox
                          p.set("inboxId", inboxId);
                          p.set("inboxType", "x");

                          // ✅ sourceUrl puede ser permalink de tweet (no lo scrapeamos)
                          p.set("sourceUrl", it.permalinkUrl ?? it.sourceUrl ?? "");

                          // ✅ title hint corto
                          const titleHint =
                            (it.text ?? "").trim().slice(0, 90) ||
                            `Tweet ${it.externalId}`;
                          p.set("title", titleHint);

                          // ✅ fuente
                          p.set(
                            "sourceName",
                            it.sourceName ?? it.sourceHandle ?? "X",
                          );

                          // ✅ CLAVE: mandamos texto para textOverride (evita scraping)
                          p.set("text", it.text ?? "");

                          router.push(`/admin/from-image-ai?${p.toString()}`);
                        }}
                        className="block w-full truncate text-left text-sm font-semibold text-slate-100 hover:text-sky-200"
                        title="Procesar con IA"
                      >
                        {it.text ? it.text : `Tweet ${it.externalId}`}
                      </button>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        {it.permalinkUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(it.permalinkUrl as string, "_blank")
                            }
                            className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold hover:border-sky-400"
                          >
                            Abrir
                          </button>
                        ) : null}
                        <span className="text-slate-500">id: {it.externalId}</span>
                      </div>
                    </div>

                    {/* 3) Fecha */}
                    <div className="text-xs text-slate-300">
                      <span title={dt ?? ""}>{formatDateTime(dt)}</span>
                    </div>

                    {/* 4) Status */}
                    <div className="text-xs text-slate-300">{it.status}</div>

                    {/* 5) Acciones */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setItemStatus(it.id, "queue")}
                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold hover:border-sky-400 disabled:opacity-50"
                      >
                        Queue
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setItemStatus(it.id, "processed")}
                        className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200 hover:border-emerald-400 disabled:opacity-50"
                      >
                        Processed
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setItemStatus(it.id, "discard")}
                        className="rounded-full border border-red-500/60 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-200 hover:border-red-400 disabled:opacity-50"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {meta ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-300">
            <div>
              Página <b>{meta.page}</b> / <b>{meta.totalPages}</b> · total{" "}
              <b>{meta.total}</b>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy || meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={busy || meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
