// app/api/manual-articles/from-image-ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../../lib/api"; // 3 niveles para volver a /lib

// Helper: si el valor existente tiene texto, se respeta;
// si está vacío, se usa el de la IA.
function preferExisting(existing?: unknown, ai?: unknown): string | undefined {
  const ex =
    typeof existing === "string"
      ? existing.trim()
      : existing == null
      ? ""
      : String(existing).trim();

  if (ex.length > 0) {
    return typeof existing === "string" ? existing : String(existing);
  }

  const aiStr =
    typeof ai === "string"
      ? ai.trim()
      : ai == null
      ? ""
      : String(ai).trim();

  if (aiStr.length > 0) {
    return typeof ai === "string" ? ai : String(ai);
  }

  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    // 1) Leer el form-data que viene del front
    const formData = await req.formData();
    const image = formData.get("image");
    const formJsonRaw = formData.get("formJson");

    // Valores actuales del formulario (pueden venir vacíos)
    let existing: any = {};
    if (typeof formJsonRaw === "string" && formJsonRaw.length > 0) {
      try {
        existing = JSON.parse(formJsonRaw);
      } catch {
        existing = {};
      }
    }

    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { message: "Falta el archivo 'image' en el form-data" },
        { status: 400 }
      );
    }

    // 2) Subir la imagen al backend /internal/uploads/image
    const uploadForm = new FormData();
    uploadForm.append("image", image, image.name || "capture.jpg");

    const uploadUrl = buildApiUrl("/internal/uploads/image");

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: uploadForm,
      // NO pongas Content-Type a mano, fetch se encarga del boundary
    });

    const uploadText = await uploadRes.text();
    let uploadJson: any = null;
    try {
      uploadJson = uploadText ? JSON.parse(uploadText) : null;
    } catch {
      // puede venir texto plano si algo falla
    }

    if (!uploadRes.ok || !uploadJson?.url) {
      return NextResponse.json(
        {
          message:
            uploadJson?.message ??
            `Error subiendo imagen (status ${uploadRes.status})`,
          raw: uploadJson ?? uploadText,
        },
        { status: 500 }
      );
    }

    // El backend devuelve algo tipo: { success, filename, url: "/uploads/xxx.jpg" }
    const imagePath: string = uploadJson.url; // "/uploads/..."
    const imagePublicUrl = buildApiUrl(imagePath); // "http://localhost:5001/uploads/..."

    // 3) Llamar al backend IA: /internal/articles/from-image-ai
    const aiUrl = buildApiUrl("/internal/articles/from-image-ai");
    const ingestKey = process.env.INGEST_KEY ?? "";

    const aiRes = await fetch(aiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ingest-key": ingestKey,
      },
      body: JSON.stringify({ imageUrl: imagePublicUrl }),
    });

    const aiText = await aiRes.text();
    let aiJson: any = null;
    try {
      aiJson = aiText ? JSON.parse(aiText) : null;
    } catch {
      aiJson = null;
    }

    // Si la IA falla, devolvemos error (o podrías meter un fallback dummy acá)
    if (!aiRes.ok || !aiJson) {
      return NextResponse.json(
        {
          message:
            aiJson?.message ??
            `Error procesando imagen con IA (status ${aiRes.status})`,
          raw: aiJson ?? aiText,
        },
        { status: 502 }
      );
    }

    // 4) Mezcla respetando lo que ya tenía el form:
    const merged = {
      title: preferExisting(existing.title, aiJson.title) ?? "",
      summary: preferExisting(existing.summary, aiJson.summary) ?? "",
      bodyHtml: preferExisting(existing.bodyHtml, aiJson.bodyHtml) ?? "",
      // Si la IA no manda categoría/ideología, se respeta lo del form o se ponen defaults
      category:
        preferExisting(existing.category, aiJson.category) ??
        existing.category ??
        "Noticias",
      ideology:
        preferExisting(existing.ideology, aiJson.ideology) ??
        existing.ideology ??
        "neutral",
      // Siempre usamos la captura recién subida
      imageUrl: imagePublicUrl,
    };

    return NextResponse.json(merged);
  } catch (err: any) {
    console.error("Error en /api/manual-articles/from-image-ai:", err);
    return NextResponse.json(
      {
        message: "Error interno procesando la imagen con IA",
        error: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
