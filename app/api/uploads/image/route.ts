// app/api/uploads/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../../lib/api";

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ??
  process.env.INGEST_KEY ??
  "supersecreto123";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Falta el archivo de imagen." },
        { status: 400 },
      );
    }

    const fd = new FormData();
    fd.append("image", file);

    const backendRes = await fetch(buildApiUrl("/internal/uploads/image"), {
      method: "POST",
      headers: INTERNAL_KEY ? { "x-ingest-key": INTERNAL_KEY } : {},
      body: fd,
    });

    const text = await backendRes.text().catch(() => "");
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        // si no es JSON, dejamos json en null y devolvemos texto crudo
      }
    }

    if (!backendRes.ok) {
      console.error(
        "Error backend /internal/uploads/image:",
        backendRes.status,
        text,
      );
      return NextResponse.json(
        {
          message: "Error al subir la imagen al backend",
          statusCode: backendRes.status,
          backend: text,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(json ?? { raw: text }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en /api/uploads/image", err);
    return NextResponse.json(
      { message: "Error inesperado al subir la imagen" },
      { status: 500 },
    );
  }
}
