// app/api/editor-articles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../lib/api";

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ?? process.env.INGEST_KEY ?? "supersecreto123";

const DEFAULT_CATEGORY = "Noticias";
const DEFAULT_IDEOLOGY = "neutral";

/**
 * Crea el artículo definitivo desde el editor.
 *
 * Lo usa la página /admin/from-image-ai cuando hacés submit del formulario
 * (después de que la IA ya sugirió título / resumen / cuerpo).
 *
 * Flujo:
 *  - El front envía JSON con title, summary, bodyHtml, category, ideology, etc.
 *  - Acá normalizamos category / ideology para que nunca vayan vacíos.
 *  - Llamamos al backend en /internal/articles/manual, que es el endpoint
 *    que realmente inserta el artículo en la base (el nombre "manual"
 *    se mantiene en el API interno aunque el contenido venga de IA).
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? undefined;

    const raw = await req.json();

    // Normalizamos categoría e ideología para que NUNCA vayan null/vacías
    const safeCategory =
      typeof raw.category === "string" && raw.category.trim().length > 0
        ? raw.category.trim()
        : DEFAULT_CATEGORY;

    const safeIdeology =
      typeof raw.ideology === "string" && raw.ideology.trim().length > 0
        ? raw.ideology.trim()
        : DEFAULT_IDEOLOGY;

    const payload = {
      ...raw,
      category: safeCategory,
      ideology: safeIdeology,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (INTERNAL_KEY) {
      headers["x-ingest-key"] = INTERNAL_KEY;
    }
    if (authHeader) {
      headers["authorization"] = authHeader;
    }

    // Backend: crea el artículo final
    const res = await fetch(buildApiUrl("/internal/articles/manual"), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "Error backend /internal/articles/manual:",
        res.status,
        text
      );
      return NextResponse.json(
        {
          message: "Error al crear el artículo en el backend",
          statusCode: res.status,
          backend: text,
        },
        { status: 502 }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: 201 });
  } catch (err) {
    console.error("Error inesperado en /api/editor-articles:", err);
    return NextResponse.json(
      { message: "Error inesperado al crear el artículo." },
      { status: 500 }
    );
  }
}
