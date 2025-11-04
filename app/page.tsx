// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { buildApiUrl } from "./lib/api";

// Tipo básico que viene de GET /articles
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

const PAGE_SIZE = 10;

export default function HomePage() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || undefined;

  // Fecha “larga” para mostrar al lado de “Últimas noticias”
  const now = new Date();
  const longDate = now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Cuando cambia la categoría de la URL, reseteamos lista y página
  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
  }, [category]);

  // Cargar artículos cuando cambian categoría o página
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const isFirstPage = page === 1 && articles.length === 0;

      if (isFirstPage) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("limit", PAGE_SIZE.toString());
        params.set("page", page.toString());
        if (category) params.set("category", category);

        const url = buildApiUrl("/articles", params);
        const res = await fetch(url, { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`failed to fetch /articles (status ${res.status})`);
        }

        const data: ArticleSummary[] = await res.json();

        if (cancelled) return;

        if (page === 1) {
          setArticles(data);
        } else {
          setArticles((prev) => [...prev, ...data]);
        }

        // Si vino menos de PAGE_SIZE, no hay más resultados
        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("error fetching /articles", err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, page]);

  function handleLoadMore() {
    if (hasMore && !isLoadingMore) {
      setPage((p) => p + 1);
    }
  }

  // Filtrado por búsqueda (en títulos)
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter((a) => a.title.toLowerCase().includes(q));
  }, [articles, search]);

  if (loading && articles.length === 0) {
    return (
      <main style={{ padding: 16 }}>
        <p style={{ color: "#999" }}>Cargando...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      {/* Título + fecha/descripción en la misma fila */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>
          Últimas noticias
        </h1>

        <div
          style={{
            fontSize: 12,
            color: "#4b5563",
            textAlign: "right",
            lineHeight: 1.4,
          }}
        >
          <div style={{ textTransform: "capitalize" }}>{longDate}</div>
          <div>
            Últimas publicaciones (scrapeadas → limpiadas → etiquetadas
            &nbsp;&quot;RIGHT&quot;)
          </div>
        </div>
      </header>

      {/* Buscador */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título..."
          style={{
            width: "100%",
            maxWidth: 360,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        />
      </div>

      {/* Mensajes según datos / búsqueda */}
      {articles.length === 0 && (
        <p style={{ color: "#999" }}>No hay artículos publicados.</p>
      )}

      {articles.length > 0 && filteredArticles.length === 0 && (
        <p style={{ color: "#999" }}>
          No hay artículos que coincidan con la búsqueda.
        </p>
      )}

      <div className="main-grid">
        {/* Columna principal */}
        <section>
          {filteredArticles.length > 0 && (
            <>
              {/* Nota destacada (hero) */}
              {(() => {
                const hero = filteredArticles[0];
                return (
                  <section
                    style={{
                      marginBottom: 24,
                      padding: 20,
                      borderRadius: 16,
                      backgroundColor: "#f3f4f6",
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>{hero.category}</span>
                      <span>·</span>
                      <span>
                        {new Date(hero.publishedAt).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span>·</span>
                      <span style={{ fontWeight: 600 }}>
                        ( {hero.ideology} )
                      </span>
                    </div>

                    <Link
                      href={`/article/${hero.slug}`}
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#111827",
                        textDecoration: "none",
                        lineHeight: 1.3,
                      }}
                    >
                      {hero.title}
                    </Link>

                    {hero.summary && (
                      <p
                        style={{
                          color: "#4b5563",
                          fontSize: 15,
                          marginTop: 10,
                          lineHeight: 1.5,
                        }}
                      >
                        {hero.summary}
                      </p>
                    )}
                  </section>
                );
              })()}

              {/* Resto de noticias */}
              {filteredArticles.length > 1 && (
                <ul
                  style={{
                    display: "grid",
                    gap: 20,
                    listStyle: "none",
                    padding: 0,
                  }}
                >
                  {filteredArticles.slice(1).map((a) => (
                    <li
                      key={a.id}
                      style={{
                        borderRadius: 12,
                        padding: 16,
                        backgroundColor: "#f9fafb",
                        color: "#111827",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
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
                        <span style={{ fontWeight: 600 }}>
                          ( {a.ideology} )
                        </span>
                      </div>

                      <Link
                        href={`/article/${a.slug}`}
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
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
                            lineHeight: 1.4,
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
              )}

              {/* Paginación simple "Cargar más" */}
              {articles.length > 0 && (
                <div style={{ marginTop: 24, textAlign: "center" }}>
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={handleLoadMore}
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
                  ) : (
                    <p style={{ color: "#6b7280", fontSize: 14 }}>
                      No hay más resultados.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Sidebar: titulares rápidos */}
        {filteredArticles.length > 0 && (
          <aside
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: 12,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Titulares rápidos
            </h2>
            <ol
              style={{
                listStyle: "decimal",
                paddingLeft: 18,
                margin: 0,
                display: "grid",
                gap: 10,
              }}
            >
              {filteredArticles.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/article/${a.slug}`}
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#111827",
                      textDecoration: "none",
                    }}
                  >
                    {a.title}
                  </Link>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                    }}
                  >
                    {new Date(a.publishedAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </main>
  );
}
