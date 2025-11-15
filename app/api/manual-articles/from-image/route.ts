// app/api/manual-articles/from-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../../lib/api"; // OJO: 3 niveles para volver a /lib

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

  // 2) Armar un FormData nuevo para reenviarlo al backend /internal/uploads/image
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

  // 3) Sugerencia "dummy IA" — más adelante acá enchufamos un modelo real
  const baseSuggested = {
    title:
      "Ejemplo: Diego Santilli viajó a Neuquén y habló sobre la reforma laboral",
    summary:
      "La nota describe la visita de Diego Santilli a Neuquén y el modelo de reforma laboral que observa el Gobierno.",
    bodyHtml:
      "<p>Este es un texto de ejemplo generado a partir de la captura. " +
      "Más adelante se conectará a una IA real que analizará la imagen y generará el contenido completo.</p>",
    category: "politica",
    ideology: "neutral",
    imageUrl: imagePublicUrl,
  };

  // 4) Mezcla respetando lo que ya tenía el form:
  const merged = {
    title: preferExisting(existing.title, baseSuggested.title) ?? "",
    summary: preferExisting(existing.summary, baseSuggested.summary) ?? "",
    bodyHtml: preferExisting(existing.bodyHtml, baseSuggested.bodyHtml) ?? "",
    category: baseSuggested.category ?? existing.category ?? "Noticias",
    ideology: baseSuggested.ideology ?? existing.ideology ?? "neutral",
    imageUrl: baseSuggested.imageUrl,
  };

  return NextResponse.json(merged);
}
