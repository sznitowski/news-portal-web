// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { buildApiUrl } from "./lib/api";
import type { ArticleListItem } from "./types/article";

type ArticleSummary = ArticleListItem;

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

  // cuando cambia la categoría, reseteo lista y paginación
  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
  }, [category]);

  // cargo artículos
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

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

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
  }, [category, page, articles.length]);

  function handleFilterChange(nextCategory: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextCategory) {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
    }

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  }

  function handleLoadMore() {
    if (hasMore && !isLoadingMore) {
      setPage((p) => p + 1);
    }
  }

  if (loading && articles.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-neutral-500">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">Últimas noticias</h1>

      {/* filtros */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => handleFilterChange(null)}
          className={`px-4 py-2 rounded-full text-sm border ${
            currentCategory === "ALL"
              ? "bg-black text-white border-black"
              : "bg-white text-black border-neutral-300"
          }`}
        >
          Todas
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("politica")}
          className={`px-4 py-2 rounded-full text-sm border ${
            currentCategory === "politica"
              ? "bg-black text-white border-black"
              : "bg-white text-black border-neutral-300"
          }`}
        >
          Política
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("economia")}
          className={`px-4 py-2 rounded-full text-sm border ${
            currentCategory === "economia"
              ? "bg-black text-white border-black"
              : "bg-white text-black border-neutral-300"
          }`}
        >
          Economía
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("internacional")}
          className={`px-4 py-2 rounded-full text-sm border ${
            currentCategory === "internacional"
              ? "bg-black text-white border-black"
              : "bg-white text-black border-neutral-300"
          }`}
        >
          Internacional
        </button>
      </div>

      {articles.length === 0 && (
        <p className="text-neutral-500">No hay artículos publicados.</p>
      )}

      <ul className="space-y-4">
        {articles.map((a) => (
          <li
            key={a.id}
            className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4"
          >
            <div className="text-[11px] text-neutral-500 mb-1 flex flex-wrap gap-1">
              <span className="uppercase tracking-wide">
                {a.category || "sin categoría"}
              </span>
              {a.publishedAt && (
                <>
                  <span>·</span>
                  <span>
                    {new Date(a.publishedAt).toLocaleString("es-AR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </>
              )}
              {a.ideology && (
                <>
                  <span>·</span>
                  <span>({a.ideology})</span>
                </>
              )}
            </div>

            <Link
              href={`/article/${a.slug}`} // 👈 RUTA CORRECTA
              className="text-lg font-semibold text-slate-900 hover:underline"
            >
              {a.title}
            </Link>

            {a.summary ? (
              <p className="mt-2 text-sm text-neutral-700">{a.summary}</p>
            ) : (
              <p className="mt-2 text-sm text-neutral-400 italic">
                (sin resumen)
              </p>
            )}
          </li>
        ))}
      </ul>

      {/* paginación simple */}
      <div className="mt-6 text-center">
        {hasMore ? (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-5 py-2 rounded-full border border-neutral-300 bg-white text-sm hover:bg-neutral-100 disabled:opacity-60"
          >
            {isLoadingMore ? "Cargando..." : "Cargar más"}
          </button>
        ) : (
          <p className="text-sm text-neutral-500">No hay más resultados.</p>
        )}
      </div>
    </main>
  );
}
