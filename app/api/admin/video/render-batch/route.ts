// app/api/admin/video/render-batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../../../lib/api";

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ??
  process.env.INGEST_KEY ??
  "supersecreto123";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const inputRelPath =
      body && typeof body.inputRelPath === "string" ? body.inputRelPath.trim() : "";

    if (!inputRelPath) {
      return NextResponse.json({ message: "Falta inputRelPath" }, { status: 400 });
    }

    // Passthrough seguro (con defaults razonables)
    const payload = {
      inputRelPath,
      startSec: typeof body?.startSec === "number" ? body.startSec : 0,
      durationSec: typeof body?.durationSec === "number" ? body.durationSec : 6,
      text: typeof body?.text === "string" ? body.text : "",
      mode: typeof body?.mode === "string" ? body.mode : "cover",
      presets: Array.isArray(body?.presets) ? body.presets : undefined,
      outputDir: typeof body?.outputDir === "string" ? body.outputDir : "video/processed",
      namePrefix: typeof body?.namePrefix === "string" ? body.namePrefix : "multi",
      logoRelPath: typeof body?.logoRelPath === "string" ? body.logoRelPath : undefined,
      logoPos: typeof body?.logoPos === "string" ? body.logoPos : undefined,
      logoScale: body?.logoScale != null ? Number(body.logoScale) : undefined,
    };

    const backendRes = await fetch(buildApiUrl("/internal/video/render-batch"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(INTERNAL_KEY ? { "x-ingest-key": INTERNAL_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await backendRes.text().catch(() => "");
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {}
    }

    if (!backendRes.ok) {
      console.error("Error backend /internal/video/render-batch:", backendRes.status, text);
      return NextResponse.json(
        {
          message: "Error al renderizar batch en el backend",
          statusCode: backendRes.status,
          backend: text,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(json ?? { raw: text }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en /api/admin/video/render-batch", err);
    return NextResponse.json(
      { message: "Error inesperado en render-batch" },
      { status: 500 },
    );
  }
}
