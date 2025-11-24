// app/api/editor-images/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildApiUrl, getPublicUrl } from "../../../lib/api";

// =======================
// Config interna
// =======================

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ?? process.env.INGEST_KEY ?? "supersecreto123";

// --- tipos de lo que devuelve el backend ---
type BackendImage = {
  filename?: string;
  url?: string;
  path?: string;
  createdAt?: string;
};

// lo que le devolvemos al front del editor
export type EditorImage = {
  filename: string;
  url: string;
  createdAt?: string | null;
  kind: "raw" | "cover" | "other";
};

// =======================
// Helpers
// =======================

// headers con el JWT guardado en cookie "editor_auth"
async function getAuthHeadersFromCookies(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("editor_auth")?.value;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  if (INTERNAL_KEY) {
    headers["x-ingest-key"] = INTERNAL_KEY;
  }

  return headers;
}

// Normaliza posibles formas de respuesta del backend
function normalizeImages(raw: unknown): BackendImage[] {
  if (Array.isArray(raw)) {
    return raw as BackendImage[];
  }

  if (raw && typeof raw === "object") {
    const obj = raw as any;

    if (Array.isArray(obj.items)) {
      return obj.items as BackendImage[];
    }

    if (Array.isArray(obj.data)) {
      return obj.data as BackendImage[];
    }
  }

  return [];
}

// Intenta clasificar según la ruta / nombre
function inferKind(rawUrl?: string, filename?: string): "raw" | "cover" | "other" {
  const src = (rawUrl ?? filename ?? "").toLowerCase();

  if (!src) return "other";

  if (src.includes("/raw/") || src.startsWith("raw_") || src.startsWith("raw-")) {
    return "raw";
  }

  if (
    src.includes("/covers/") ||
    src.includes("/cover/") ||
    src.startsWith("cover_") ||
    src.startsWith("cover-")
  ) {
    return "cover";
  }

  return "other";
}

// =======================
// GET /api/editor-images/list
// =======================

export async function GET(_req: NextRequest) {
  try {
    const headers = await getAuthHeadersFromCookies();

    const res = await fetch(buildApiUrl("/internal/uploads/images"), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[editor-images/list] Backend devolvió error",
        res.status,
        res.statusText,
        text,
      );

      return NextResponse.json(
        {
          message: "Error al obtener la lista de imágenes del backend",
          statusCode: res.status,
          backend: text,
        },
        { status: 502 },
      );
    }

    const rawJson = await res.json();
    const items = normalizeImages(rawJson);

    const mapped: EditorImage[] = items.map((img) => {
      const rawUrl =
        img.url ??
        img.path ??
        (img.filename ? `/uploads/${img.filename}` : undefined);

      const publicUrl = rawUrl ? getPublicUrl(rawUrl) : "";
      const kind = inferKind(rawUrl, img.filename);

      return {
        filename: img.filename ?? rawUrl ?? "sin-nombre",
        url: publicUrl,
        createdAt: img.createdAt ?? null,
        kind,
      };
    });

    return NextResponse.json({ items: mapped });
  } catch (err: any) {
    console.error("[editor-images/list] Error inesperado:", err);

    return NextResponse.json(
      {
        message: "Error inesperado al obtener la lista de imágenes",
        error: String(err?.message ?? err),
      },
      { status: 500 },
    );
  }
}
