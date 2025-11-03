// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

const API_BASE = "http://localhost:5001";
const PAGE_SIZE = 5;

const CATEGORIES: { label: string; value: string | null }[] = [
  { label: "Todas", value: null },
  { label: "Política", value: "politica" },
  // después podés sumar más categorías acá
];

export default function HomePage() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // pide una página al backend
  async function fetchPage(targetPage: number, append: boolean) {
    setLoading(true);

    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("page", String(targetPage));
    if (category) {
      params.set("category", category);
    }

    try {
      const res = await fetch(`${API_BASE}/articles?${params.toString()}`, {
        cache: "no-store",
      });
      const data: ArticleSummary[] = await res.json();

      if (append) {
        setArticles((prev) => [...prev, ...data]);
      } else {
        setArticles(data);
      }

      // si viene menos que PAGE_SIZE asumimos que no hay más
      setHasMore(data.length === PAGE_SIZE);
      setPage(targetPage);
    } catch (err) {
      console.error("error fetching /articles", err);
    } finally {
      setLoading(false);
    }
  }

  // carga inicial y cuando cambia la categoría
  useEffect(() => {
    fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleChangeCategory = (value: string | null) => {
    setCategory(value);
    // el useEffect dispara fetchPage(1, false)
  };

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchPage(page + 1, true);
  };

  return (
    <main style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
      <header
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#fff" }}>
          Últimas noticias
        </h1>

        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.value;
            return (
              <button
                key={cat.label}
                onClick={() => handleChangeCategory(cat.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid #333",
                  backgroundColor: isActive ? "#fff" : "transparent",
                  color: isActive ? "#000" : "#ddd",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>
      </header>

      {articles.length === 0 && !loading && (
        <p style={{ color: "#999" }}>No hay artículos publicados.</p>
      )}

      <ul
        style={{
          display: "grid",
          gap: 24,
          listStyle: "none",
          padding: 0,
        }}
      >
        {articles.map((a) => (
          <li
            key={a.id}
            style={{
              border: "1px solid #333",
              borderRadius: 8,
              padding: 16,
              backgroundColor: "#111",
              color: "#eee",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#999",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {a.category} ·{" "}
              {new Date(a.publishedAt).toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </div>

            <Link
              href={`/articulo/${a.slug}`}
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
              }}
            >
              {a.title}
            </Link>

            {a.summary ? (
              <p
                style={{
                  color: "#ccc",
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
                  color: "#444",
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

      {/* paginación / cargar más */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {hasMore ? (
          <button
            onClick={handleLoadMore}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid #333",
              backgroundColor: loading ? "#333" : "#fff",
              color: loading ? "#aaa" : "#000",
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
              minWidth: 140,
            }}
          >
            {loading ? "Cargando..." : "Cargar más"}
          </button>
        ) : (
          <p style={{ color: "#777", fontSize: 13 }}>
            No hay más resultados.
          </p>
        )}
      </div>
    </main>
  );
}
