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
  process.env.NEXT_PUBLIC_API_BASE ?? // fallback por si después la querés usar
  "http://127.0.0.1:5001";

/**
 * Normaliza la base de la API:
 * - Quita barras finales.
 * - Si el host es "localhost", lo fuerza a "127.0.0.1"
 *   para evitar quilombos de resolución (ECONNRESET).
 */
function normalizeApiBase(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}

export const API_BASE = normalizeApiBase(RAW_API_BASE);

/**
 * Base pública del sitio (Next).
 * La podemos usar para armar links públicos a notas, etc.
 */
const RAW_SITE_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3001";

export const SITE_BASE = RAW_SITE_BASE.replace(/\/+$/, "");

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
 * en una URL absoluta.
 *
 * Reglas:
 * - Si viene absoluta (http/https), se respeta tal cual.
 * - Si empieza con /uploads/... => se cuelga SIEMPRE de la API (Nest),
 *   porque ahí es donde se sirve el estático (/app/uploads).
 * - Para cualquier otra ruta relativa, se cuelga del sitio público (Next).
 */
export function getPublicUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";

  // si ya es absoluta (http/https), no toco nada
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;

  if (cleanPath.startsWith("/uploads/")) {
    // IMPORTANTE: imágenes y estáticos van contra la API
    return `${API_BASE}${cleanPath}`;
  }

  // resto de rutas -> sitio público
  return `${SITE_BASE}${cleanPath}`;
}

/* =======================
 * Artículos
 * ======================= */

/**
 * Lista de artículos (paginada + filtro opcional por categoría)
 */
export async function getLatestArticles(
  page = 1,
  limit = 10,
  category?: string,
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
  slug: string,
): Promise<ArticleFull | null> {
  const res = await fetch(buildApiUrl(`/articles/${slug}`), {
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(
      `failed to fetch /articles/:slug (status ${res.status})`,
    );
  }

  return res.json();
}

/* =======================
 * Economía / Mercado
 * ======================= */

export async function getMarketSummary(): Promise<MarketSummary> {
  const res = await fetch(buildApiUrl("/market/summary"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `failed to fetch /market/summary (status ${res.status})`,
    );
  }

  return res.json();
}

export async function getBcraSummary(): Promise<BcraSummary> {
  const res = await fetch(buildApiUrl("/market/bcra"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`failed to fetch /market/bcra (status ${res.status})`);
  }

  return res.json();
}

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const res = await fetch(buildApiUrl("/economy/budget"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `failed to fetch /economy/budget (status ${res.status})`,
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
 * Sube una imagen al backend Nest (vía NEXT /api/uploads/image)
 * y devuelve la URL pública absoluta para usar en <img src="...">
 *
 * IMPORTANTE: usar solo desde componentes "use client" (recibe un File del browser).
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  // OJO: hablamos con el route interno de Next,
  // no directo al backend Nest.
  const res = await fetch("/api/uploads/image", {
    method: "POST",
    body: formData,
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(
      `Error al subir imagen (${res.status}): ${text || "sin detalle"}`,
    );
  }

  let data: Partial<UploadImageResponse> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Partial<UploadImageResponse>;
    } catch {
      // si algún día cambiamos el shape y no es JSON, data queda vacío
    }
  }

  const rawUrl = data.url;
  if (!rawUrl) {
    throw new Error("El backend no devolvió URL de imagen");
  }

  // URL absoluta para usar directo en <img src=...>
  return getPublicUrl(rawUrl);
}
