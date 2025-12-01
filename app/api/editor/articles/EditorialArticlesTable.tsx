// app/api/editor/articles/EditorialArticlesTable.tsx
"use client";

import React, { useEffect, useState } from "react";
import { FacebookRowToggle } from "./../../../components/admin/FacebookRowToggle";

type EditorialStatus = "draft" | "published" | "archived";

type EditorialArticle = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  ideology: string;
  sourceIdeology: string | null;
  sourceType: string;
  status: EditorialStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;

  coverImageUrl?: string | null;
  imageUrl?: string | null;
};

const STATUS_LABEL: Record<EditorialStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EditorialArticlesTable() {
  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | EditorialStatus>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchArticles(opts?: { status?: string }) {
    const status = opts?.status ?? statusFilter;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      status,
      page: "1",
      limit: "50",
    });

    try {
      const res = await fetch(`/api/editor/articles?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `Error ${res.status} al cargar artículos: ${body.slice(0, 200)}`
        );
      }

      const raw = await res.json();

      let list: EditorialArticle[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(raw.items)) {
        list = raw.items;
      } else if (Array.isArray(raw.data)) {
        list = raw.data;
      } else {
        list = [];
      }

      setArticles(list);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchArticles({ status: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleAction(
    id: number,
    action: "publish" | "unpublish"
  ): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        id: String(id),
        action,
      });

      const res = await fetch(`/api/editor/articles?${params.toString()}`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `Error ${res.status} al ${action}: ${body.slice(0, 200)}`
        );
      }

      const updated = (await res.json()) as EditorialArticle;

      setArticles((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const total = articles.length;

  return (
    <section className="mt-10 w-full">
      {/* Header filtros / título */}
      <header className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400/80">
            Notas del panel editorial
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-50">
              Gestión de notas
            </h2>
            {total > 0 && (
              <span className="rounded-full bg-slate-900/60 px-3 py-0.5 text-[11px] font-medium text-slate-300">
                {total} registros
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Usá el filtro de estado para revisar borradores, publicadas o
            archivadas. Los cambios impactan directo en la portada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Estado
          </span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | EditorialStatus)
            }
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-100 outline-none transition focus:border-sky-400"
          >
            <option value="all">Todas</option>
            <option value="draft">Borradores</option>
            <option value="published">Publicadas</option>
            <option value="archived">Archivadas</option>
          </select>

          <button
            type="button"
            onClick={() => fetchArticles({ status: statusFilter })}
            className="ml-1 rounded-lg border border-sky-500/70 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300 transition hover:bg-sky-500/20"
          >
            Recargar
          </button>
        </div>
      </header>

      {loading && (
        <p className="mb-2 text-sm text-slate-300">Cargando artículos…</p>
      )}
      {error && (
        <p className="mb-2 text-sm text-rose-400">⚠ {error}</p>
      )}

      {articles.length === 0 && !loading ? (
        <p className="text-sm text-slate-300">
          No hay artículos para mostrar.
        </p>
      ) : (
        <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-[0_22px_70px_rgba(15,23,42,0.85)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm text-slate-100">
              <thead>
                <tr className="bg-slate-950/90">
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    ID
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Título
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Categoría
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Ideología
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Origen
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Estado
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Publicada
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Creada
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Facebook
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a, idx) => (
                  <tr
                    key={a.id}
                    className={
                      idx % 2 === 0
                        ? "bg-slate-950/40"
                        : "bg-slate-950/20"
                    }
                  >
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top text-xs text-slate-400">
                      {a.id}
                    </td>
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-50">
                          {a.title}
                        </span>
                        <span className="max-w-xs text-xs text-slate-400">
                          {a.summary ?? "(sin resumen)"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          /{a.slug}
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top text-xs">
                      <span className="inline-flex rounded-full bg-slate-900/70 px-2.5 py-0.5 text-[11px] font-medium text-slate-200">
                        {a.category}
                      </span>
                    </td>
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top text-xs text-slate-200">
                      {a.ideology}
                    </td>
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top text-xs text-slate-200">
                      {a.sourceType}
                    </td>
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top text-xs">
                      <span
                        className={
                          a.status === "published"
                            ? "inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300"
                            : a.status === "draft"
                            ? "inline-flex rounded-full bg-slate-700/40 px-2.5 py-0.5 text-[11px] font-semibold text-slate-200"
                            : "inline-flex rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300"
                        }
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                    </td>
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top text-xs text-slate-300">
                      {formatDate(a.publishedAt)}
                    </td>
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top text-xs text-slate-300">
                      {formatDate(a.createdAt)}
                    </td>

                    {/* Facebook */}
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top text-xs">
                      <FacebookRowToggle
                        articleId={a.id}
                        title={a.title}
                        summary={a.summary ?? undefined}
                        coverImageUrl={
                          a.coverImageUrl ?? a.imageUrl ?? undefined
                        }
                        disabled={a.status !== "published"}
                      />
                    </td>

                    {/* Acciones */}
                    <td className="border-b border-slate-900 px-3 py-2.5 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.status !== "published" && (
                          <button
                            type="button"
                            onClick={() => handleAction(a.id, "publish")}
                            className="rounded-full border border-emerald-500/80 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-500/20"
                          >
                            Publicar
                          </button>
                        )}

                        {a.status === "published" && (
                          <button
                            type="button"
                            onClick={() => handleAction(a.id, "unpublish")}
                            className="rounded-full border border-amber-400/80 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200 transition hover:bg-amber-500/20"
                          >
                            Ocultar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
