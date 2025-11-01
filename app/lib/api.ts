// app/lib/api.ts
import "server-only";
import { ArticleListItem, ArticleFull } from "../types/article";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001";

/**
 * Trae las últimas publicaciones públicas (listado).
 * GET /articles
 */
export async function getLatestArticles(): Promise<ArticleListItem[]> {
  const res = await fetch(`${API_BASE}/articles`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error fetching /articles", res.status, res.statusText);
    return [];
  }

  const data = (await res.json()) as ArticleListItem[];
  return data;
}

/**
 * Trae el detalle de una nota por slug.
 * GET /articles/:slug
 * (esto lo vamos a usar en la página de detalle /article/[slug])
 */
export async function getArticleBySlug(
  slug: string,
): Promise<ArticleFull | null> {
  const res = await fetch(`${API_BASE}/articles/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(
      `Error fetching /articles/${slug}`,
      res.status,
      res.statusText,
    );
    return null;
  }

  const data = (await res.json()) as ArticleFull;
  return data;
}
