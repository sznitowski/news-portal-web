// app/api/editor-articles/from-url-ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../../lib/api";

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ?? process.env.INGEST_KEY ?? "supersecreto123";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? undefined;
    const raw = await req.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (INTERNAL_KEY) headers["x-ingest-key"] = INTERNAL_KEY;
    if (authHeader) headers["authorization"] = authHeader;

    // ⚠️ OJO: este endpoint tiene que existir en el backend Nest
    const res = await fetch(buildApiUrl("/internal/ai/article-from-url"), {
      method: "POST",
      headers,
      body: JSON.stringify(raw),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("Error backend /internal/ai/article-from-url:", res.status, text);
      return NextResponse.json(
        { message: "Error generando desde URL", statusCode: res.status, backend: text },
        { status: 502 },
      );
    }

    // devuelve JSON “suggested” al front
    return new NextResponse(text, {
      status: 200,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch (err) {
    console.error("Error inesperado en /api/editor-articles/from-url-ai:", err);
    return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
  }
}
