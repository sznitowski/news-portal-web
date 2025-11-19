// app/sections/NewsListSection.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildApiUrl } from "../lib/api";

type ArticleSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  ideology: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

type ArticlesResponse = {
  items: ArticleSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

// SUBIMOS EL PAGE_SIZE PARA TRAER TODA LA DATA ACTUAL
const PAGE_SIZE = 50;

export default function NewsListSection({ category }: { category?: string }) {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");

  // reset por categoría
  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
  }, [category]);

  // fetch paginado
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const isFirstPage = page === 1 && articles.length === 0;
      if (isFirstPage) setLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams();
        params.set("limit", PAGE_SIZE.toString());
        params.set("page", page.toString());
        if (category) params.set("category", category);

        const url = buildApiUrl("/articles", params);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: ArticlesResponse = await res.json();
        if (cancelled) return;

        if (page === 1) {
          setArticles(data.items);
        } else {
          setArticles((prev) => [...prev, ...data.items]);
        }

        // usar meta del backend
        setHasMore(data.meta.hasNextPage);
      } catch {
        // noop
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsLoadingMore(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // ya no dependemos de articles.length para evitar dobles fetch
  }, [category, page]);

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter((a) => a.title.toLowerCase().includes(q));
  }, [articles, search]);

  const quickHeadlines = articles.slice(0, 4);

  const today = new Date();
  const todayLabel = today.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section
      style={{
        maxWidth: 1120,
        margin: "32px auto 64px",
        padding: 28,
        borderRadius: 32,
        background:
          "radial-gradient(140% 140% at 0% 0%, #e5e7eb 0%, #f9fafb 45%, #ffffff 100%)",
        boxShadow: "0 40px 90px rgba(15,23,42,0.25)",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Banda superior */}
      <div
        style={{
          marginBottom: 24,
          marginTop: 4,
          borderRadius: 18,
          background:
            "linear-gradient(90deg,#020617 0%,#0f172a 40%,#111827 100%)",
          color: "#f9fafb",
          padding: "14px 22px",
          boxShadow: "0 20px 40px rgba(15,23,42,0.65)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            Últimas noticias
          </h2>

          <div style={{ textAlign: "right", fontSize: 12, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 500 }}>
              {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}
            </div>
            <div style={{ opacity: 0.9 }}>
              Últimas publicaciones (scrapeadas → limpiadas → etiquetadas
              &nbsp;&quot;RIGHT&quot;)
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título..."
          style={{
            width: "100%",
            maxWidth: 540,
            padding: "10px 16px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            fontSize: 14,
            boxShadow: "0 6px 18px rgba(148,163,184,0.4)",
          }}
        />
      </div>

      {/* Grid principal */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        {/* Lista */}
        <section>
          {articles.length === 0 && (
            <p style={{ color: "#9ca3af" }}>No hay artículos publicados.</p>
          )}
          {articles.length > 0 && filteredArticles.length === 0 && (
            <p style={{ color: "#9ca3af" }}>
              No hay artículos que coincidan con la búsqueda.
            </p>
          )}

          <ul
            style={{
              display: "grid",
              gap: 24,
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {filteredArticles.map((a) => (
              <li
                key={a.id}
                style={{
                  borderRadius: 18,
                  padding: 22,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  boxShadow: "0 18px 40px -18px rgba(15,23,42,0.35)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span>{a.category}</span>
                  <span>·</span>
                  <span>
                    {new Date(a.publishedAt).toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                  <span>·</span>
                  <span style={{ fontWeight: 600 }}>( {a.ideology} )</span>
                </div>

                <Link
                  href={`/article/${a.slug}`}
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#111827",
                    textDecoration: "none",
                  }}
                >
                  {a.title}
                </Link>

                {a.summary ? (
                  <p
                    style={{
                      color: "#4b5563",
                      fontSize: 14,
                      marginTop: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    {a.summary}
                  </p>
                ) : (
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      marginTop: 8,
                      fontStyle: "italic",
                    }}
                  >
                    (sin resumen)
                  </p>
                )}
              </li>
            ))}
          </ul>

          {/* Cargar más */}
          {articles.length > 0 && hasMore && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button
                type="button"
                onClick={() => !isLoadingMore && setPage((p) => p + 1)}
                disabled={isLoadingMore}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#111827",
                  color: "#fff",
                  cursor: isLoadingMore ? "default" : "pointer",
                  opacity: isLoadingMore ? 0.6 : 1,
                }}
              >
                {isLoadingMore ? "Cargando..." : "Cargar más"}
              </button>
            </div>
          )}
          {!hasMore && articles.length > 0 && (
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 16 }}>
              No hay más resultados.
            </p>
          )}
        </section>

        {/* Sidebar */}
        <aside
          style={{
            alignSelf: "flex-start",
            position: "sticky",
            top: 120,
          }}
        >
          <section
            style={{
              borderRadius: 18,
              padding: 16,
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 18px 40px -18px rgba(15,23,42,0.35)",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              Titulares rápidos
            </h3>

            {quickHeadlines.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>
                Todavía no hay artículos para mostrar aquí.
              </p>
            ) : (
              <ol
                style={{
                  listStyle: "decimal",
                  paddingLeft: 20,
                  margin: 0,
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                  color: "#111827",
                }}
              >
                {quickHeadlines.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/article/${a.slug}`}
                      style={{ textDecoration: "none", color: "#111827" }}
                    >
                      {a.title}
                    </Link>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      {new Date(a.publishedAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
