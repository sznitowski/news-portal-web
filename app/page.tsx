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
  const currentCategory = category ?? "ALL";

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

  function handleCategoryClick(nextCategory: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextCategory) {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
    }

    router.push(`/?${params.toString()}`, { scroll: false });
  }

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

  // Hero = primer artículo de la lista filtrada, resto = lista normal
  const heroArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

  // Titulares rápidos: primeros 4 artículos cargados
  const topHeadlines = useMemo(
    () => articles.slice(0, 4),
    [articles]
  );

  if (loading && articles.length === 0) {
    return (
      <main style={{ padding: 24 }}>
        <p style={{ color: "#999" }}>Cargando...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1fr)",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        {/* Columna principal */}
        <section>
          {/* Barra negra de título + fecha la maneja el header, acá solo contenido */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título..."
              style={{
                width: "100%",
                maxWidth: 420,
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
            />
          </div>

          {/* Hero (nota principal) */}
          {heroArticle && (
            <article
              style={{
                marginBottom: 20,
                borderRadius: 14,
                padding: 20,
                background:
                  "linear-gradient(135deg, #f9fafb 0%, #ffffff 60%, #f3f4f6 100%)",
                boxShadow: "0 18px 35px -18px rgba(15,23,42,0.4)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span>{heroArticle.category}</span>
                <span>·</span>
                <span>
                  {new Date(heroArticle.publishedAt).toLocaleString("es-AR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span>·</span>
                <span style={{ fontWeight: 600 }}>( {heroArticle.ideology} )</span>
              </div>

              <Link
                href={`/article/${heroArticle.slug}`}
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: "#111827",
                  textDecoration: "none",
                }}
              >
                {heroArticle.title}
              </Link>

              {heroArticle.summary && (
                <p
                  style={{
                    marginTop: 12,
                    color: "#4b5563",
                    fontSize: 15,
                    lineHeight: 1.5,
                    maxWidth: "90%",
                  }}
                >
                  {heroArticle.summary}
                </p>
              )}
            </article>
          )}

          {/* Mensajes según datos / búsqueda */}
          {articles.length === 0 && (
            <p style={{ color: "#999" }}>No hay artículos publicados.</p>
          )}

          {articles.length > 0 && filteredArticles.length === 0 && (
            <p style={{ color: "#999" }}>
              No hay artículos que coincidan con la búsqueda.
            </p>
          )}

          {/* Lista normal (sin el hero) */}
          <ul
            style={{
              display: "grid",
              gap: 18,
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {restArticles.map((a) => (
              <li
                key={a.id}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  boxShadow: "0 10px 15px -5px rgba(15,23,42,0.18)",
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
        </section>

        {/* Columna lateral: titulares rápidos */}
        <aside>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 12,
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: 8,
            }}
          >
            Titulares rápidos
          </h2>

          {topHeadlines.length === 0 ? (
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              Todavía no hay titulares para mostrar.
            </p>
          ) : (
            <ol
              style={{
                listStyle: "decimal",
                paddingLeft: 20,
                margin: 0,
                display: "grid",
                gap: 12,
                fontSize: 14,
              }}
            >
              {topHeadlines.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/article/${a.slug}`}
                    style={{
                      display: "block",
                      fontWeight: 500,
                      color: "#111827",
                      textDecoration: "none",
                      marginBottom: 4,
                    }}
                  >
                    {a.title}
                  </Link>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    {new Date(a.publishedAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </main>
  );
}
