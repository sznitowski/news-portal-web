// app/lib/api.ts
import type { ArticleListItem, ArticleFull } from "../types/article";

/**
 * Base de la API (backend Nest).
 * Sale de .env.local -> NEXT_PUBLIC_API_URL
 */
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE ?? // fallback por si después la querés usar
  "http://localhost:5001";

// normalizo para que no termine en "/"
export const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

/**
 * Helper para armar URLs de la API.
 * - Acepta path ("/articles", "/articles/:slug", etc.)
 * - Opcionalmente, un URLSearchParams con query (?page=1&limit=10...)
 */
export function buildApiUrl(path: string, params?: URLSearchParams): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE}${cleanPath}`);

  if (params) {
    params.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Convierte una URL relativa devuelta por el backend (ej: "/uploads/archivo.png")
 * en una URL absoluta (ej: "http://localhost:5001/uploads/archivo.png").
 * Si ya viene absoluta, la devuelve tal cual.
 */
export function getPublicUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";

  // si ya es absoluta (http/https), no toco nada
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const cleanPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;

  return `${API_BASE}${cleanPath}`;
}

/**
 * Lista de artículos (paginada + filtro opcional por categoría)
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

/* =======================
 * Upload de imágenes
 * ======================= */

export interface UploadImageResponse {
  success: boolean;
  filename: string;
  url: string; // viene como "/uploads/archivo.ext"
}

/**
 * Sube una imagen al backend Nest y devuelve la URL pública absoluta
 * (ej: "http://localhost:5001/uploads/archivo.png").
 *
 * IMPORTANTE: usar solo desde componentes "use client" (recibe un File del browser).
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(buildApiUrl("/internal/uploads/image"), {
    method: "POST",
    body: formData,
    // credentials: "include", // descomentá si después usás cookies
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error al subir imagen (${res.status}): ${text}`);
  }

  const data = (await res.json()) as UploadImageResponse;

  if (!data.success || !data.url) {
    throw new Error("El backend devolvió una respuesta inválida al subir la imagen");
  }

  // URL absoluta para usar directo en <img src=...>
  return getPublicUrl(data.url);
}
