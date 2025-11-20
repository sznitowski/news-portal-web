// app/api/editor/articles/EditorialArticlesTable.tsx
"use client";

import React, { useEffect, useState } from "react";

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
  const [statusFilter, setStatusFilter] = useState<"all" | EditorialStatus>(
    "all"
  );
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

      // 🔑 Siempre garantizamos un array
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

  return (
    <section style={{ marginTop: 32 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>
          Notas del panel editorial
        </h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14 }}>Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | EditorialStatus)
            }
            style={{ padding: "4px 8px", fontSize: 14 }}
          >
            <option value="all">Todas</option>
            <option value="draft">Borradores</option>
            <option value="published">Publicadas</option>
            <option value="archived">Archivadas</option>
          </select>

          <button
            type="button"
            onClick={() => fetchArticles({ status: statusFilter })}
            style={{
              padding: "4px 10px",
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #666",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </div>
      </header>

      {loading && (
        <p style={{ fontSize: 14, marginBottom: 8 }}>Cargando artículos…</p>
      )}
      {error && (
        <p style={{ fontSize: 14, color: "#f66", marginBottom: 8 }}>
          {error}
        </p>
      )}

      {articles.length === 0 && !loading ? (
        <p style={{ fontSize: 14 }}>No hay artículos para mostrar.</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            borderRadius: 8,
            border: "1px solid #333",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ background: "#111" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Título</th>
                <th style={thStyle}>Categoría</th>
                <th style={thStyle}>Ideología</th>
                <th style={thStyle}>Origen</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Publicada</th>
                <th style={thStyle}>Creada</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td style={tdStyle}>{a.id}</td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{a.title}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#aaa",
                          // antes: maxWidth: 500, whiteSpace: "nowrap"
                          maxWidth: 260,
                          whiteSpace: "normal",
                          overflow: "hidden",
                        }}
                      >
                        {a.summary ?? "(sin resumen)"}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#777",
                        }}
                      >
                        /{a.slug}
                      </span>
                    </div>
                  </td>
                  <td style={tdStyle}>{a.category}</td>
                  <td style={tdStyle}>{a.ideology}</td>
                  <td style={tdStyle}>{a.sourceType}</td>
                  <td style={tdStyle}>{STATUS_LABEL[a.status]}</td>
                  <td style={tdStyle}>{formatDate(a.publishedAt)}</td>
                  <td style={tdStyle}>{formatDate(a.createdAt)}</td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        justifyContent: "flex-start",
                      }}
                    >
                      {a.status !== "published" && (
                        <button
                          type="button"
                          onClick={() => handleAction(a.id, "publish")}
                          style={{
                            padding: "4px 8px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid #2ecc71",
                            background: "#111",
                            color: "#2ecc71",
                            cursor: "pointer",
                          }}
                        >
                          Publicar
                        </button>
                      )}
                      {a.status === "published" && (
                        <button
                          type="button"
                          onClick={() => handleAction(a.id, "unpublish")}
                          style={{
                            padding: "4px 8px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid #e67e22",
                            background: "#111",
                            color: "#e67e22",
                            cursor: "pointer",
                          }}
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
      )}
    </section>
  );
}

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "left",
  borderBottom: "1px solid #333",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #222",
  verticalAlign: "top",
};
