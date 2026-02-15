"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type InboxItem = {
  id: number;

  // backend (OfficialSocialInboxEntity)
  provider: "facebook" | "instagram" | "x";
  sourceName: string | null;
  sourceHandle: string | null;
  sourceUrl: string | null;

  externalId: string;
  permalinkUrl: string | null;

  createdTime: string | null; // datetime (puede venir null)
  sourceType: string;

  text: string | null;
  mediaJson: any | null;
  rawJson: any | null;

  topicHint: "economia" | "politica" | "internacional" | string | null;
  status: "new" | "queued" | "processed" | "discarded";

  createdAt: string;
};

type InboxResponse = {
  items: InboxItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
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

export default function NewsOfficialInboxPage() {
  const router = useRouter();

  const [status, setStatus] = useState<
    "new" | "queued" | "processed" | "discarded" | "all"
  >("new");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(30);

  // importador JSON
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<InboxResponse | null>(null);

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
      const res = await fetch(`/api/news-official-inbox?${qs}`, {
        method: "GET",
      });
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

  async function setItemStatus(
    id: number,
    action: "queue" | "discard" | "processed",
  ) {
    try {
      setBusy(true);
      setErr(null);
      const res = await fetch("/api/news-official-inbox", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, id }),
      });

      const text = await res.text().catch(() => "");
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.message ?? `Error (${res.status})`);

      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Error actualizando estado");
    } finally {
      setBusy(false);
    }
  }

  async function importFromJson() {
    try {
      setBusy(true);
      setErr(null);
      setImportMsg(null);

      const parsed = JSON.parse(importJson);

      // acepta {items:[...]} o directamente [...]
      const items = Array.isArray(parsed) ? parsed : parsed?.items;
      if (!Array.isArray(items))
        throw new Error("JSON inválido: falta items[]");

      // Mapeo: tu JSON usa "topic" y "publishedAt"
      const mapped = items.map((it: any) => ({
        provider: it.provider,
        externalId: it.externalId,
        permalinkUrl: it.permalinkUrl ?? null,
        text: it.text ?? null,

        sourceName: it.sourceName ?? null,
        sourceHandle: it.sourceHandle ?? null,
        sourceUrl: it.sourceUrl ?? null,

        // backend espera createdTime (ISO) - si viene null, backend pone NOW()
        createdTime: it.publishedAt ?? it.createdTime ?? null,

        sourceType: it.sourceType ?? (it.metaJson?.type ? "post" : "post"),

        mediaJson: it.mediaJson ?? null,

        // guardamos lo crudo (incluye metaJson)
        rawJson: it,

        topicHint: it.topic ?? it.topicHint ?? null,
        status: it.status ?? "new",
      }));

      const res = await fetch("/api/news-official-inbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: mapped }),
      });

      const text = await res.text().catch(() => "");
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.message ?? `Error (${res.status})`);

      setImportMsg("Importado OK");
      setImportJson("");
      setImportOpen(false);

      // refrescar listado (a la primer página para ver lo nuevo)
      setPage(1);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Error importando JSON");
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
            <h1 className="mt-2 text-2xl font-semibold">Cuentas oficiales</h1>
            <p className="mt-1 text-sm text-slate-300">
              Publicaciones detectadas en cuentas oficiales para procesar con IA.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setImportOpen((v) => !v)}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold hover:border-sky-400"
              disabled={busy}
            >
              {importOpen ? "Cerrar importador" : "Importar JSON"}
            </button>

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

        {importMsg ? (
          <div className="mt-4 rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
            {importMsg}
          </div>
        ) : null}

        {importOpen ? (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-[12px] font-semibold text-slate-200">
              Pegá JSON (
              <span className="text-slate-400">
                {"{ items: [...] }"} o {"[...]"}{" "}
              </span>
              )
            </div>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="mt-2 h-[520px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-[12px] leading-5 text-slate-100 outline-none focus:border-sky-400"
              placeholder='{"items":[{...}]}'
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void importFromJson()}
                disabled={busy || !importJson.trim()}
                className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50"
              >
                {busy ? "Importando..." : "Importar"}
              </button>
            </div>
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

          <div className="md:col-span-9">
            <label className="text-[11px] text-slate-300">Buscar</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-400"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="fuente, handle, texto, id..."
            />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <div className="grid grid-cols-[120px_1fr_180px_140px_220px] gap-0 border-b border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            <div>Provider</div>
            <div>Texto / Fuente</div>
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
                  className="grid grid-cols-[120px_1fr_180px_140px_220px] items-start gap-0 px-3 py-3"
                >
                  {/* 1) Provider */}
                  <div className="text-xs text-slate-200">{it.provider}</div>

                  {/* 2) Texto / Fuente */}
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        const p = new URLSearchParams();

                        // ✅ identifica que viene del OFFICIAL inbox
                        p.set("inboxId", String(it.id));
                        p.set("inboxType", "official");

                        // ✅ la URL puede ser X, pero NO la vamos a scrapear (usamos textOverride)
                        p.set("sourceUrl", it.permalinkUrl ?? "");

                        // ✅ hint title: 90 chars máx (evita querystring gigante)
                        const titleHint =
                          (it.text ?? "").trim().slice(0, 90) ||
                          `Post ${it.externalId}`;
                        p.set("title", titleHint);

                        p.set(
                          "sourceName",
                          it.sourceName ?? it.sourceHandle ?? it.provider,
                        );

                        if (it.topicHint) p.set("topic", String(it.topicHint));

                        // ✅ CLAVE: mandamos el texto para que el backend no intente scrapear X
                        p.set("text", it.text ?? "");

                        router.push(`/admin/from-image-ai?${p.toString()}`);
                      }}
                      className="block w-full truncate text-left text-sm font-semibold text-slate-100 hover:text-sky-200"
                      title="Procesar con IA"
                    >
                      {it.text ? it.text : `Post ${it.externalId}`}
                    </button>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="truncate">
                        {it.sourceName ?? "—"}{" "}
                        {it.sourceHandle ? (
                          <span className="text-slate-500">{it.sourceHandle}</span>
                        ) : null}
                      </span>

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
                    </div>
                  </div>

                  {/* 3) Fecha */}
                  <div className="text-xs text-slate-300">
                    {(() => {
                      const dt = it.createdTime ?? it.createdAt;
                      return <span title={dt ?? ""}>{formatDateTime(dt)}</span>;
                    })()}
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
              ))}
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
