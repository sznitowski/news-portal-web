// app/lib/api.ts
import type { ArticleListItem, ArticleFull } from "../types/article";
import type {
  MarketSummary,
  BcraSummary,
  BudgetSummary,
} from "../types/market";

/**
 * Base de la API (backend Nest).
 * Sale de .env.local -> NEXT_PUBLIC_API_URL
 */
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "http://127.0.0.1:5001";

/**
 * Normaliza una base URL:
 * - Quita barras finales.
 * - Si el host es "localhost", lo fuerza a "127.0.0.1"
 */
function normalizeBase(raw: string): string {
  const trimmed = (raw ?? "").toString().replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname === "localhost") url.hostname = "127.0.0.1";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}

export const API_BASE = normalizeBase(RAW_API_BASE);

/**
 * Base pública del sitio (Next).
 * Se usa solo para rutas públicas del front.
 */
const RAW_SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3001";
export const SITE_BASE = normalizeBase(RAW_SITE_BASE);

/**
 * Helper para armar URLs de la API.
 */
export function buildApiUrl(path: string, params?: URLSearchParams): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE}${cleanPath}`);

  if (params) {
    params.forEach((value, key) => url.searchParams.set(key, value));
  }

  return url.toString();
}

/**
 * URLs públicas:
 * - /uploads/* y /brand/* SIEMPRE salen de la API (Nest)
 * - el resto sale del sitio (Next)
 */
export function getPublicUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";

  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;

  if (cleanPath.startsWith("/uploads/") || cleanPath.startsWith("/brand/")) {
    return `${API_BASE}${cleanPath}`;
  }

  return `${SITE_BASE}${cleanPath}`;
}

/**
 * Assets de marca (siempre desde el backend Nest)
 */
export function getBrandUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE}${cleanPath}`;
}

/* =======================
 * Artículos
 * ======================= */

export async function getLatestArticles(
  page = 1,
  limit = 10,
  category?: string,
): Promise<ArticleListItem[]> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (category && category !== "all") params.set("category", category);

  const res = await fetch(buildApiUrl("/articles", params), { cache: "no-store" });
  if (!res.ok) throw new Error(`failed to fetch /articles (status ${res.status})`);
  return res.json();
}

export async function getArticleBySlug(slug: string): Promise<ArticleFull | null> {
  const res = await fetch(buildApiUrl(`/articles/${slug}`), { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`failed to fetch /articles/:slug (status ${res.status})`);
  return res.json();
}

/* =======================
 * Economía / Mercado
 * ======================= */

export async function getMarketSummary(): Promise<MarketSummary> {
  const res = await fetch(buildApiUrl("/market/summary"), { cache: "no-store" });
  if (!res.ok) throw new Error(`failed to fetch /market/summary (status ${res.status})`);
  return res.json();
}

export async function getBcraSummary(): Promise<BcraSummary> {
  const res = await fetch(buildApiUrl("/market/bcra"), { cache: "no-store" });
  if (!res.ok) throw new Error(`failed to fetch /market/bcra (status ${res.status})`);
  return res.json();
}

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const res = await fetch(buildApiUrl("/economy/budget"), { cache: "no-store" });
  if (!res.ok) throw new Error(`failed to fetch /economy/budget (status ${res.status})`);
  return res.json();
}

/* =======================
 * Upload de imágenes
 * ======================= */

export interface UploadImageResponse {
  success: boolean;
  filename: string;
  url: string; // "/uploads/archivo.ext"
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/uploads/image", { method: "POST", body: formData });
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`Error al subir imagen (${res.status}): ${text || "sin detalle"}`);
  }

  let data: Partial<UploadImageResponse> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Partial<UploadImageResponse>;
    } catch {}
  }

  if (!data.url) throw new Error("El backend no devolvió URL de imagen");

  return getPublicUrl(data.url);
}
