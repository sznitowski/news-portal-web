// app/lib/api.ts
import type { ArticleListItem, ArticleFull } from "../types/article";

// viene de .env.local (NEXT_PUBLIC_API_BASE=http://localhost:5001)
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5001";

/**
 * Helper para armar URLs de la API.
 * - Acepta path ("/articles", "/articles/:slug", etc.)
 * - Opcionalmente, un URLSearchParams con query (?page=1&limit=10...)
 */
export function buildApiUrl(path: string, params?: URLSearchParams): string {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const url = new URL(API_BASE + path);

  if (params) {
    params.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Lista de artículos (paginada + filtro opcional por categoría)
 * No la estás usando todavía en el front, pero queda disponible.
 */
export async function getLatestArticles(
  page = 1,
  limit = 10,
  category?: string
): Promise<ArticleListItem[]> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (category && category !== "all") {
    params.set("category", category);
  }

  const res = await fetch(buildApiUrl("/articles", params), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`failed to fetch /articles (status ${res.status})`);
  }

  return res.json();
}

/**
 * Detalle por slug
 */
export async function getArticleBySlug(
  slug: string
): Promise<ArticleFull | null> {
  const res = await fetch(buildApiUrl(`/articles/${slug}`), {
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(
      `failed to fetch /articles/:slug (status ${res.status})`
    );
  }

  return res.json();
}
