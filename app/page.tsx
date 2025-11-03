// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const searchParams = useSearchParams();

  // category viene de la URL: /?category=politica
  const categoryParam = searchParams.get("category");
  const currentCategory =
    categoryParam && categoryParam !== "all" ? categoryParam : null;

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Cuando cambia la categoría (por menú o chip) reseteamos lista y paginación
  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
  }, [currentCategory]);

  // Carga de artículos cada vez que cambia page o categoría
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        params.set("page", String(page));
        if (currentCategory) {
          params.set("category", currentCategory);
        }

        const res = await fetch(
          `http://localhost:5001/articles?${params.toString()}`,
          { cache: "no-store" }
        );
        const data: ArticleSummary[] = await res.json();

        setArticles((prev) => (page === 1 ? data : [...prev, ...data]));
        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("error fetching /articles", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [page, currentCategory]);

  // Cambiar categoría actual (chips + menú usan lo mismo)
  function handleChangeCategory(cat: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (!cat) {
      params.delete("category");
    } else {
      params.set("category", cat);
    }

    // siempre volvemos a la primera página
    params.delete("page");

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function handleLoadMore() {
    if (!loading && hasMore) {
      setPage((p) => p + 1);
    }
  }

  const isAll = !currentCategory;
  const isPolitica = currentCategory === "politica";

  if (loading && articles.length === 0) {
    return (
      <main style={{ padding: 16 }}>
        <p style={{ color: "#999" }}>Cargando...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
        Últimas noticias
      </h1>

      {/* Filtros rápidos (además del menú de arriba) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => handleChangeCategory(null)}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: isAll ? "1px solid #fff" : "1px solid #555",
            background: isAll ? "#fff" : "transparent",
            color: isAll ? "#000" : "#ddd",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Todas
        </button>
        <button
          onClick={() => handleChangeCategory("politica")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: isPolitica ? "1px solid #fff" : "1px solid #555",
            background: isPolitica ? "#fff" : "transparent",
            color: isPolitica ? "#000" : "#ddd",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Política
        </button>
        {/* Más chips a futuro: Economía, Internacional, etc. */}
      </div>

      {articles.length === 0 && (
        <p style={{ color: "#999" }}>No hay artículos publicados.</p>
      )}

      <ul style={{ display: "grid", gap: 24, listStyle: "none", padding: 0 }}>
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

      {/* Botón "Cargar más" */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        {hasMore ? (
          <button
            onClick={handleLoadMore}
            disabled={loading}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid #555",
              background: "#111",
              color: "#eee",
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Cargando..." : "Cargar más"}
          </button>
        ) : (
          <p style={{ color: "#777", fontSize: 13 }}>No hay más resultados.</p>
        )}
      </div>
    </main>
  );
}
