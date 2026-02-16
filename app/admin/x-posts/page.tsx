"use client";

import { useEffect, useMemo, useState } from "react";

type XFeedItem = {
  xPostId: string;
  articleId: number;
  status: "draft" | "ready" | "posted";
  text: string | null;
  assetUrl: string | null;
  variant: string | null;
  updatedAt: string;
  title: string;
  slug: string;
};

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("news_access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPatch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function RadarXManualPage() {
  const [items, setItems] = useState<XFeedItem[]>([]);
  const [status, setStatus] = useState<"ready" | "posted" | "draft">("ready");
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

      const data = await apiGet<{ items: XFeedItem[] }>(
        `/api/internal/x-posts/feed?${qs.toString()}`,
      );
      setItems(data.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando feed");
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
    return items.filter((it) =>
      `${it.title ?? ""} ${it.text ?? ""}`.toLowerCase().includes(qq),
    );
  }, [items, q]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const markPosted = async (xPostId: string) => {
    try {
      await apiPatch(`/api/internal/x-posts/${xPostId}/posted`);
      setItems((prev) => prev.filter((x) => x.xPostId !== xPostId));
    } catch (e: any) {
      alert(e?.message ?? "No se pudo marcar como posted");
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-50">X Manual</h1>
          <p className="text-xs text-zinc-400">
            Copiás texto + abrís imagen, publicás en X a mano y marcás “posted”.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100"
          >
            <option value="ready">ready</option>
            <option value="posted">posted</option>
            <option value="draft">draft</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="buscar..."
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
          <div
            key={it.xPostId}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-50">
                  {it.title}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  articleId: {it.articleId} · xPostId: {it.xPostId} ·{" "}
                  {it.variant ?? "-"}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 md:flex-row">
                <button
                  onClick={() => copy(it.text ?? "")}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 hover:border-purple-300/70"
                  disabled={!it.text}
                >
                  Copiar texto
                </button>

                {it.assetUrl ? (
                  <a
                    href={it.assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 hover:border-sky-300/70"
                  >
                    Abrir imagen
                  </a>
                ) : (
                  <span className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">
                    Sin imagen
                  </span>
                )}

                <button
                  onClick={() => markPosted(it.xPostId)}
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-black hover:bg-emerald-400"
                >
                  Marcar posted
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
