// app/api/editor-images/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildApiUrl, getPublicUrl } from "../../../lib/api";

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ?? process.env.INGEST_KEY ?? "supersecreto123";

// Aseguramos que corre en Node, no en Edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Construye headers de auth a partir de la cookie "editor_auth"
 * + la INTERNAL_KEY para hablar con Nest.
 */
async function buildAuthHeadersFromCookies(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  // en tu versión de Next, cookies() devuelve una Promise
  const cookieStore = await cookies();
  const token = cookieStore.get("editor_auth")?.value;

  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  if (INTERNAL_KEY) {
    headers["x-ingest-key"] = INTERNAL_KEY;
  }

  return headers;
}

export async function GET(_req: NextRequest) {
  try {
    const headers = await buildAuthHeadersFromCookies();

    const url = buildApiUrl("/internal/uploads/images");
    console.log("[editor-images/list] llamando a", url);

    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[editor-images/list] backend devolvió error",
        res.status,
        text,
      );
      return NextResponse.json(
        {
          message: "Error inesperado al obtener la lista de imágenes",
          error: "backend-error",
        },
        { status: 502 },
      );
    }

    const json = (await res.json()) as {
      success?: boolean;
      items?: Array<{ url: string; [k: string]: any }>;
      [k: string]: any;
    };

    // 🔴 AQUÍ está la clave:
    // convertimos /uploads/... en http://localhost:5001/uploads/...
    const itemsWithPublicUrl = (json.items ?? []).map((item) => ({
      ...item,
      url: getPublicUrl(item.url),
    }));

    return NextResponse.json(
      {
        ...json,
        items: itemsWithPublicUrl,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[editor-images/list] Error inesperado:", err);
    return NextResponse.json(
      {
        message: "Error inesperado al obtener la lista de imágenes",
        error: "fetch failed",
      },
      { status: 500 },
    );
  }
}
