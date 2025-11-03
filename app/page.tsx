// app/page.tsx
"use client";

import { useEffect, useState } from "react";
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

        const res = await fetch(buildApiUrl("/articles", params), {
          cache: "no-store",
        });

        const data: ArticleSummary[] = await res.json();

        if (cancelled) return;

        if (page === 1) {
          setArticles(data);
        } else {
          setArticles((prev) => [...prev, ...data]);
        }

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

  function handleFilterChange(nextCategory: string | null) {
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

  if (loading && articles.length === 0) {
    return (
      <main style={{ padding: 16 }}>
        <p style={{ color: "#999" }}>Cargando...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
        Últimas noticias
      </h1>

      {/* Filtros simples */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => handleFilterChange(null)}
          style={{
            padding: "6px 16px",
            borderRadius: 999,
            border:
              currentCategory === "ALL" ? "1px solid #000" : "1px solid #d1d5db",
            backgroundColor:
              currentCategory === "ALL" ? "#111827" : "#ffffff",
            color: currentCategory === "ALL" ? "#ffffff" : "#111827",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Todas
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("politica")}
          style={{
            padding: "6px 16px",
            borderRadius: 999,
            border:
              currentCategory === "politica"
                ? "1px solid #000"
                : "1px solid #d1d5db",
            backgroundColor:
              currentCategory === "politica" ? "#111827" : "#ffffff",
            color: currentCategory === "politica" ? "#ffffff" : "#111827",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Política
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("economia")}
          style={{
            padding: "6px 16px",
            borderRadius: 999,
            border:
              currentCategory === "economia"
                ? "1px solid #000"
                : "1px solid #d1d5db",
            backgroundColor:
              currentCategory === "economia" ? "#111827" : "#ffffff",
            color: currentCategory === "economia" ? "#ffffff" : "#111827",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Economía
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("internacional")}
          style={{
            padding: "6px 16px",
            borderRadius: 999,
            border:
              currentCategory === "internacional"
                ? "1px solid #000"
                : "1px solid #d1d5db",
            backgroundColor:
              currentCategory === "internacional" ? "#111827" : "#ffffff",
            color: currentCategory === "internacional" ? "#ffffff" : "#111827",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Internacional
        </button>
      </div>

      {articles.length === 0 && (
        <p style={{ color: "#999" }}>No hay artículos publicados.</p>
      )}

      <ul className="article-list">
        {articles.map((a) => (
          <li key={a.id} className="article-card">
            <div className="article-meta">
              {a.category.toUpperCase()} ·{" "}
              {new Date(a.publishedAt).toLocaleString("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              · ({a.ideology})
            </div>

            <Link href={`/articulo/${a.slug}`} className="article-title">
              {a.title}
            </Link>

            {a.summary ? (
              <p className="article-summary">{a.summary}</p>
            ) : (
              <p className="article-summary article-summary--empty">
                (sin resumen)
              </p>
            )}
          </li>
        ))}
      </ul>

      {/* Paginación simple "Cargar más" */}
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
              color: "#ffffff",
              cursor: isLoadingMore ? "default" : "pointer",
              opacity: isLoadingMore ? 0.7 : 1,
            }}
          >
            {isLoadingMore ? "Cargando..." : "Cargar más"}
          </button>
        ) : (
          <p style={{ color: "#777", fontSize: 14 }}>No hay más resultados.</p>
        )}
      </div>
    </main>
  );
}
