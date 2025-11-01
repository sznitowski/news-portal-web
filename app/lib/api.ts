// app/lib/api.ts
import { ArticleListItem, ArticleFull } from "../types/article";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE; // http://localhost:5001

// lista
export async function getLatestArticles(): Promise<ArticleListItem[]> {
  const res = await fetch(`${API_BASE}/articles`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`failed to fetch /articles (status ${res.status})`);
  }

  return res.json();
}

// detalle
export async function getArticleBySlug(slug: string): Promise<ArticleFull | null> {
  const res = await fetch(`${API_BASE}/articles/${slug}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    // no existe el artículo -> devolvemos null para que el componente muestre "no encontrado"
    return null;
  }

  if (!res.ok) {
    // otro error real (500, etc)
    throw new Error(
      `failed to fetch /articles/:slug (status ${res.status})`
    );
  }

  return res.json();
}
