// app/lib/api.ts

import { ArticleListItem, ArticleFull } from "../types/article";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001";

// Desactiva cache de Next para que siempre traiga fresco en dev
const fetchJSON = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, {
    // En prod podemos tunear a revalidate cada X min
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status} al pedir ${url}`);
  }

  return res.json() as Promise<T>;
};

// GET /articles  → lista pública (máx 20 últimas)
export async function getPublicArticles(): Promise<ArticleListItem[]> {
  return fetchJSON<ArticleListItem[]>(`${API_BASE}/articles`);
}

// GET /articles/:slug → nota completa
export async function getArticleBySlug(
  slug: string
): Promise<ArticleFull> {
  return fetchJSON<ArticleFull>(`${API_BASE}/articles/${slug}`);
}

// Helper para formatear fecha linda en español
export function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
