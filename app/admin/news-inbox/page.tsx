"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type InboxItem = {
  id: number;
  sourcePlatform: string;
  sourceName: string;
  sourceHandle: string | null;
  sourceUrl: string | null;
  title: string;
  url: string;
  publishedAt: string | null;
  topic: "economia" | "politica" | "internacional";
  importance: "alta" | "media" | "baja";
  status: "new" | "queued" | "processed" | "discarded";
  createdAt: string;
};

type InboxResponse = {
  items: InboxItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

function badgeClass(kind: string) {
  if (kind === "alta") return "border-red-400/70 bg-red-500/10 text-red-200";
  if (kind === "media") return "border-amber-400/70 bg-amber-500/10 text-amber-200";
  return "border-slate-600 bg-slate-900 text-slate-200";
}

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


export default function NewsInboxPage() {

  const router = useRouter();
  const [status, setStatus] = useState<"new" | "queued" | "processed" | "discarded" | "all">("new");
  const [topic, setTopic] = useState<"" | "economia" | "politica" | "internacional">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(30);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<InboxResponse | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    if (status !== "all") p.set("status", status);
    if (topic) p.set("topic", topic);
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [page, limit, status, topic, q]);

  async function load() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/news-inbox?${qs}`, { method: "GET" });
      const text = await res.text().catch(() => "");
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) throw new Error(json?.message ?? `Error (${res.status})`);

      setData(json as InboxResponse);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando inbox");
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  async function setItemStatus(id: number, action: "queue" | "discard" | "processed") {
    try {
      setBusy(true);
      setErr(null);
      const res = await fetch("/api/news-inbox", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, id }),
      });

      const text = await res.text().catch(() => "");
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.message ?? `Error (${res.status})`);

      // recargar
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
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Panel Radar
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Bandeja de noticias</h1>
            <p className="mt-1 text-sm text-slate-300">
              Inbox interno: filtrás, marcás y luego mandás a procesar (IA) cuando armemos ese paso.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold hover:border-sky-400"
            disabled={busy}
          >
            {busy ? "Actualizando..." : "Refrescar"}
          </button>
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
                setStatus(e.target.value as any);
              }}
            >
              <option value="new">new</option>
              <option value="queued">queued</option>
              <option value="processed">processed</option>
              <option value="discarded">discarded</option>
              <option value="all">all</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-[11px] text-slate-300">Topic</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              value={topic}
              onChange={(e) => {
                setPage(1);
                setTopic(e.target.value as any);
              }}
            >
              <option value="">(todos)</option>
              <option value="politica">politica</option>
              <option value="economia">economia</option>
              <option value="internacional">internacional</option>
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="text-[11px] text-slate-300">Buscar</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-400"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="titulo o fuente..."
            />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <div className="grid grid-cols-[120px_110px_1fr_140px_140px_220px] gap-0 border-b border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            <div>Topic</div>
            <div>Import.</div>
            <div>Título / Fuente</div>
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
              {items.map((it) => (
                <div
                  key={it.id}
                  className="grid grid-cols-[120px_110px_1fr_140px_140px_220px] items-start gap-0 px-3 py-3"
                >
                  {/* 1) Topic */}
                  <div className="text-xs text-slate-200">{it.topic}</div>

                  {/* 2) Importancia */}
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeClass(
                        it.importance,
                      )}`}
                    >
                      {it.importance}
                    </span>
                  </div>

                  {/* 3) Título / Fuente (ACA está el “procesar”) */}
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        const p = new URLSearchParams();
                        p.set("inboxId", String(it.id));
                        p.set("sourceUrl", it.url);
                        p.set("title", it.title);
                        p.set("sourceName", it.sourceName);
                        p.set("topic", it.topic);
                        router.push(`/admin/from-image-ai?${p.toString()}`);
                      }}
                      className="block w-full truncate text-left text-sm font-semibold text-slate-100 hover:text-sky-200"
                      title="Procesar con IA"
                    >
                      {it.title}
                    </button>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="truncate">{it.sourceName}</span>

                      {it.url ? (
                        <button
                          type="button"
                          onClick={() => window.open(it.url, "_blank")}
                          className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold hover:border-sky-400"
                        >
                          Abrir
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* 4) Fecha */}
                  <div className="text-xs text-slate-300">
                    {(() => {
                      const dt = it.publishedAt ?? it.createdAt;
                      return <span title={dt ?? ""}>{formatDateTime(dt)}</span>;
                    })()}
                  </div>

                  {/* 5) Status */}
                  <div className="text-xs text-slate-300">{it.status}</div>

                  {/* 6) Acciones */}
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
                      Done
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
              ))}

            </div>
          )}
        </div>

        {meta ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-300">
            <div>
              Página <b>{meta.page}</b> / <b>{meta.totalPages}</b> · total <b>{meta.total}</b>
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
