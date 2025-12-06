// app/api/editor-images/auto-from-raw/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, getPublicUrl } from "../../../lib/api";

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ??
  process.env.INGEST_KEY ??
  "supersecreto123";

// Saca una keyword simple del título (primera palabra "larga")
function deriveKeyword(title?: string | null): string | undefined {
  if (!title) return undefined;

  const words = title
    .toLowerCase()
    .split(/[^a-záéíóúñü0-9]+/i)
    .filter((w) => w.length >= 4);

  return words[0] || undefined;
}

// Armamos headers de auth (similar a enhance)
function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Si el panel guardó un token en cookie, lo pasamos al backend
  const tokenFromCookie = req.cookies.get("editor_auth")?.value;
  if (tokenFromCookie) {
    headers["authorization"] = `Bearer ${tokenFromCookie}`;
  }

  if (INTERNAL_KEY) {
    headers["x-ingest-key"] = INTERNAL_KEY;
  }

  return headers;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          title?: string;
          subtitle?: string;
          footer?: string;
          keyword?: string;
          alertTag?: string | null;
        }
      | null;

    if (!body) {
      return NextResponse.json(
        { message: "JSON inválido" },
        { status: 400 },
      );
    }

    const title = body.title ?? "";
    const subtitle = body.subtitle ?? "";
    // 👉 default igual que en el editor de imágenes
    const footer = body.footer ?? null;

    // Si no viene keyword explícita, derivamos una del título
    const keyword = (body.keyword ?? deriveKeyword(title)) || undefined;

    const headers = buildAuthHeaders(req);

    const res = await fetch(
      buildApiUrl("/internal/uploads/auto-cover-from-raw"),
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          keyword,
          options: {
            title,
            subtitle,
            footer,
            // Pasamos también la etiqueta por si el backend la quiere usar
            alertTag: body.alertTag ?? null,
          },
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[auto-from-raw] Error backend:",
        res.status,
        res.statusText,
        text,
      );
      return NextResponse.json(
        {
          message:
            "Error al generar portada desde imagen RAW en el backend",
          statusCode: res.status,
          backend: text,
        },
        { status: 502 },
      );
    }

    const json = (await res.json()) as {
      coverUrl?: string | null;
      url?: string | null;
      rawUrl?: string | null;
      message?: string;
    };

    // Siempre preferimos la URL de cover que devuelve el backend
    const backendUrl = json.coverUrl ?? json.url;
    if (!backendUrl) {
      return NextResponse.json(
        {
          message:
            "El backend no devolvió una URL de cover válida desde RAW.",
        },
        { status: 500 },
      );
    }

    const enhancedImageUrl = getPublicUrl(backendUrl);

    return NextResponse.json(
      {
        enhancedImageUrl,
        message:
          json.message ??
          "Portada generada automáticamente desde una imagen RAW.",
        overlay: {
          title,
          subtitle,
          footer,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[auto-from-raw] Error inesperado:", err);
    return NextResponse.json(
      { message: "Error inesperado al generar portada desde RAW." },
      { status: 500 },
    );
  }
}
