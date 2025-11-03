// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildApiUrl } from "./lib/api";
import ArticleCard from "./components/ArticleCard";

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

  const currentCategory = category ?? "ALL";

  if (loading && articles.length === 0) {
    return (
      <main style={{ padding: 16 }}>
        <p style={{ color: "#6b7280" }}>Cargando...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 16,
          color: "#111827",
        }}
      >
        Últimas noticias
      </h1>

      {/* Filtros simples */}
      <div style={{ marginBottom: 24, display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => handleFilterChange(null)}
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            border:
              currentCategory === "ALL" ? "1px solid #111827" : "1px solid #d1d5db",
            backgroundColor:
              currentCategory === "ALL" ? "#111827" : "transparent",
            color: currentCategory === "ALL" ? "#f9fafb" : "#374151",
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
            padding: "8px 18px",
            borderRadius: 999,
            border:
              currentCategory === "politica"
                ? "1px solid #111827"
                : "1px solid #d1d5db",
            backgroundColor:
              currentCategory === "politica" ? "#111827" : "transparent",
            color: currentCategory === "politica" ? "#f9fafb" : "#374151",
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
            padding: "8px 18px",
            borderRadius: 999,
            border:
              currentCategory === "economia"
                ? "1px solid #111827"
                : "1px solid #d1d5db",
            backgroundColor:
              currentCategory === "economia" ? "#111827" : "transparent",
            color: currentCategory === "economia" ? "#f9fafb" : "#374151",
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
            padding: "8px 18px",
            borderRadius: 999,
            border:
              currentCategory === "internacional"
                ? "1px solid #111827"
                : "1px solid #d1d5db",
            backgroundColor:
              currentCategory === "internacional" ? "#111827" : "transparent",
            color: currentCategory === "internacional" ? "#f9fafb" : "#374151",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Internacional
        </button>
      </div>

      {articles.length === 0 && (
        <p style={{ color: "#6b7280" }}>No hay artículos publicados.</p>
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
          <ArticleCard key={a.id} article={a} />
        ))}
      </ul>

      {/* Paginación simple "Cargar más" */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        {hasMore ? (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              backgroundColor: "#111827",
              color: "#f9fafb",
              cursor: isLoadingMore ? "default" : "pointer",
              opacity: isLoadingMore ? 0.7 : 1,
              fontSize: 14,
            }}
          >
            {isLoadingMore ? "Cargando..." : "Cargar más"}
          </button>
        ) : (
          <p style={{ color: "#9ca3af", fontSize: 14 }}>
            No hay más resultados.
          </p>
        )}
      </div>
    </main>
  );
}
