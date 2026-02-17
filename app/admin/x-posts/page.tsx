// admin/x-posts/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type InboxStatus = "new" | "queued" | "processed" | "discarded" | string;


type InboxItem = {
  id: number;
  provider: string;

  externalId: string;
  permalinkUrl: string | null;

  text: string | null;
  title?: string | null;

  createdTime?: string | null;
  publishedAt?: string | null;

  sourceName?: string | null;
  sourceHandle?: string | null;
  sourceUrl?: string | null;

  status: InboxStatus;
  metaJson?: any;
};

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("news_access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { ...getAuthHeaders() }, cache: "no-store" });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return (text ? JSON.parse(text) : null) as T;
}

async function apiPatch(url: string): Promise<void> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
}

function pickTitle(it: InboxItem) {
  const t = (it.title ?? "").trim();
  if (t) return t;
  const text = (it.text ?? "").trim();
  if (!text) return "(Sin texto)";
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

function pickMetaLine(it: InboxItem) {
  const name = (it.sourceName ?? "").trim();
  const handle = (it.sourceHandle ?? "").trim();
  const src = [name, handle].filter(Boolean).join(" ");
  return [
    it.provider ? `provider: ${it.provider}` : null,
    src ? `fuente: ${src}` : null,
    it.externalId ? `id: ${it.externalId}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function pickDate(it: InboxItem) {
  return it.publishedAt ?? it.createdTime ?? "";
}

export default function RadarOfficialInboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [status, setStatus] = useState<string>("new");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);

    try {
      const qs = new URLSearchParams();
      qs.set("status", status);
      qs.set("limit", "50");
      qs.set("offset", "0");
      if (q.trim()) qs.set("q", q.trim());

      // ✅ OJO: el listado es GET /internal/official-social-inbox (sin /feed)
      const data = await apiGet<any>(`/api/internal/x-posts?${qs.toString()}`);

      // tolerante: puede venir {items:[...]} o directamente [...]
      const list: InboxItem[] = Array.isArray(data) ? data : (data?.items ?? []);
      setItems(list);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;

    return items.filter((it) => {
      const blob = [
        it.provider,
        it.externalId,
        it.sourceHandle,
        it.sourceName,
        it.title,
        it.text,
        it.permalinkUrl,
        it.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return blob.includes(qq);
    });
  }, [items, q]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const patchAndRemove = async (id: number, action: "queue" | "processed" | "discard") => {
    try {
      await apiPatch(`/api/internal/x-posts/${id}/${action}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e?.message ?? `No se pudo ejecutar ${action}`);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-50">Cuentas oficiales</h1>
          <p className="text-xs text-zinc-400">
            Items ingestados. Los marcás como queued / processed / discard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100"
          >
            <option value="new">new</option>
            <option value="queued">queued</option>
            <option value="processed">processed</option>
            <option value="discarded">discarded</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="buscar (fuente, handle, texto, id...)"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 md:w-64"
          />

          <button
            onClick={load}
            className="rounded-xl bg-purple-500 px-4 py-2 text-xs font-semibold text-black hover:bg-purple-400 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Cargando..." : "Refrescar"}
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-xl border border-red-400/50 bg-red-500/10 p-3 text-xs text-red-200">
          {err}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((it) => (
          <div key={it.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-50">{pickTitle(it)}</div>

                <div className="mt-1 text-[11px] text-zinc-400">
                  {pickMetaLine(it)}
                  {pickDate(it) ? ` · ${pickDate(it)}` : ""} · status: {it.status}
                </div>

                {it.permalinkUrl && (
                  <a
                    href={it.permalinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-100 hover:border-sky-300/70"
                  >
                    Abrir
                  </a>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2 md:flex-row">
                <button
                  onClick={() => copy(it.text ?? "")}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 hover:border-purple-300/70"
                  disabled={!it.text}
                >
                  Copiar texto
                </button>

                <button
                  onClick={() => patchAndRemove(it.id, "queue")}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 hover:border-sky-300/70"
                >
                  Queue
                </button>

                <button
                  onClick={() => patchAndRemove(it.id, "processed")}
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-black hover:bg-emerald-400"
                >
                  Processed
                </button>

                <button
                  onClick={() => patchAndRemove(it.id, "discard")}
                  className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:border-red-300/70"
                >
                  Discard
                </button>
              </div>
            </div>

            {it.text && (
              <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[12px] text-zinc-200">
                {it.text}
              </pre>
            )}
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
            No hay items para mostrar.
          </div>
        )}
      </div>
    </main>
  );
}
