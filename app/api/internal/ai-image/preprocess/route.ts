// app/api/internal/ai-image/preprocess/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, getPublicUrl } from "@/app/lib/api";

function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const tokenFromCookie = req.cookies.get("editor_auth")?.value;
  if (tokenFromCookie) headers["authorization"] = `Bearer ${tokenFromCookie}`;

  const key = process.env.INTERNAL_INGEST_KEY ?? process.env.INGEST_KEY ?? "";
  if (key) headers["x-ingest-key"] = key;

  return headers;
}

/**
 * Convierte URLs absolutas del backend a path local /uploads/...
 * Evita SSRF bloqueado en el backend (localhost/127.0.0.1).
 */
function normalizeToUploadsPath(input: string) {
  const u = (input ?? "").toString().trim();
  if (!u) return u;

  // ya es path local
  if (u.startsWith("/uploads/")) return u;
  if (u.startsWith("uploads/")) return `/${u}`;

  // si viene URL absoluta -> usar solo pathname si apunta a /uploads/
  try {
    const parsed = new URL(u);
    if (parsed.pathname?.startsWith("/uploads/")) return parsed.pathname;
  } catch {
    // no era URL válida, seguimos
  }

  return u;
}

/**
 * Devuelve URL pública:
 * - Si es /uploads/... -> getPublicUrl(...)
 * - Si es absoluta (https://...) -> no tocar
 * - Si es otra cosa -> devolver como venga
 */
function toPublicMaybeUploads(u: string) {
  const s = (u ?? "").toString().trim();
  if (!s) return s;

  if (s.startsWith("/uploads/") || s.startsWith("uploads/")) {
    const path = s.startsWith("/") ? s : `/${s}`;
    return getPublicUrl(path);
  }

  // si es URL absoluta, la dejamos tal cual
  if (/^https?:\/\//i.test(s)) return s;

  return s;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          rawUrl?: string | null;
          imageUrl?: string | null;
          hint?: string | null;
        }
      | null;

    const raw = (body?.rawUrl ?? body?.imageUrl ?? "").toString().trim();
    const hint = (body?.hint ?? "").toString().trim();

    if (!raw) {
      return NextResponse.json(
        { message: "Falta rawUrl/imageUrl (string) en el body." },
        { status: 400 },
      );
    }

    // clave: si te mandan url absoluta a /uploads, bajamos a pathname
    const imageUrl = normalizeToUploadsPath(raw);

    const headers = buildAuthHeaders(req);

    const res = await fetch(buildApiUrl("/internal/ai-image/preprocess"), {
      method: "POST",
      headers,
      body: JSON.stringify({ imageUrl, hint: hint || undefined }),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => ({}))) as {
      cleanUrl?: string | null;
      skipped?: boolean;
      reason?: string | null;
      debug?: any;
    };

    if (!res.ok) {
      return NextResponse.json(
        {
          message: "Error en preprocess (backend).",
          statusCode: res.status,
          backend: JSON.stringify(json).slice(0, 1500),
          debug: { sentImageUrl: imageUrl, original: raw },
        },
        { status: 502 },
      );
    }

    const cleanUrlRaw = (json.cleanUrl ?? "").toString().trim();
    if (!cleanUrlRaw) {
      return NextResponse.json(
        { message: "El backend no devolvió cleanUrl.", backend: json },
        { status: 500 },
      );
    }

    // IMPORTANTE: el backend a veces ya devuelve /uploads/... (outRel o fallback)
    // y otras podría devolver https://...
    const cleanUrl = toPublicMaybeUploads(cleanUrlRaw);

    return NextResponse.json(
      {
        cleanUrl,
        skipped: !!json.skipped,
        reason: json.reason ?? null,
        debug: json.debug ?? null,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[preprocess] Error inesperado:", err);
    return NextResponse.json(
      { message: "Error inesperado en preprocess." },
      { status: 500 },
    );
  }
}
