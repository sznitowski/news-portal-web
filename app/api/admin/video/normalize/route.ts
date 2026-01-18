// app/api/admin/video/normalize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../../../lib/api";

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ??
  process.env.INGEST_KEY ??
  "supersecreto123";

export async function POST(req: NextRequest) {
  try {
    // 1) Leer raw para debug (esto te salva cuando curl/PS manda algo raro)
    const contentType = req.headers.get("content-type") ?? "";
    const raw = await req.text().catch(() => "");

    // 2) Parse seguro
    let body: any = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        // Si NO es JSON válido, devolvemos error con info útil
        return NextResponse.json(
          {
            message: "Body no es JSON válido",
            contentType,
            raw,
          },
          { status: 400 },
        );
      }
    }

    const inputRelPath =
      body && typeof body.inputRelPath === "string" ? body.inputRelPath.trim() : "";

    if (!inputRelPath) {
      return NextResponse.json(
        {
          message: "Falta inputRelPath",
          contentType,
          raw,
        },
        { status: 400 },
      );
    }

    // 3) Proxy al backend (normalize necesita ingest-key)
    const backendRes = await fetch(buildApiUrl("/internal/video/normalize"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(INTERNAL_KEY ? { "x-ingest-key": INTERNAL_KEY } : {}),
      },
      body: JSON.stringify({ inputRelPath }),
    });

    const text = await backendRes.text().catch(() => "");
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {}
    }

    if (!backendRes.ok) {
      console.error(
        "Error backend /internal/video/normalize:",
        backendRes.status,
        text,
      );
      return NextResponse.json(
        {
          message: "Error al normalizar el video en el backend",
          statusCode: backendRes.status,
          backend: text,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(json ?? { raw: text }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en /api/admin/video/normalize", err);
    return NextResponse.json(
      { message: "Error inesperado en normalize" },
      { status: 500 },
    );
  }
}
