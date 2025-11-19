// app/api/editor-articles/from-image-ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, getPublicUrl } from "../../../lib/api";

const DEFAULT_CATEGORY = "Noticias";
const DEFAULT_IDEOLOGY = "neutral";

type FormSnapshot = {
  title?: string;
  summary?: string;
  bodyHtml?: string;
  category?: string;
  ideology?: string;
  sourceIdeology?: string;
  publishedAt?: string;
  imageUrl?: string;
};

type AiSuggestion = {
  title?: string;
  summary?: string;
  bodyHtml?: string;
  category?: string;
  ideology?: string;
  sourceIdeology?: string;
};

// Helper: escapa comillas y & para usar en atributos HTML (alt="")
function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Si el valor existente tiene texto, se respeta;
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

  return aiStr.length > 0 ? aiStr : undefined;
}

// Si el usuario dejó la categoría vacía o en el default,
// usamos la sugerida por la IA. Si eligió algo distinto, lo respetamos.
function mergeCategory(userCat?: string, aiCat?: string): string {
  const u = (userCat ?? "").trim();
  const a = (aiCat ?? "").trim();

  if (!u || u === DEFAULT_CATEGORY) {
    return a || u || DEFAULT_CATEGORY;
  }
  return u;
}

// Igual que arriba pero para ideología.
function mergeIdeology(userIde?: string, aiIde?: string): string {
  const u = (userIde ?? "").trim();
  const a = (aiIde ?? "").trim();

  if (!u || u === DEFAULT_IDEOLOGY) {
    return a || u || DEFAULT_IDEOLOGY;
  }
  return u;
}

// misma key que usás para /internal/articles
const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ?? process.env.INGEST_KEY ?? "supersecreto123";

export async function POST(req: NextRequest) {
  try {
    // Token que viene del front (handleProcessImage le manda Authorization: Bearer xxx)
    const authHeader = req.headers.get("authorization") ?? undefined;

    const formData = await req.formData();
    const file = formData.get("image");
    const formJson = formData.get("formJson") as string | null;

    let form: FormSnapshot = {};
    if (formJson) {
      try {
        form = JSON.parse(formJson) as FormSnapshot;
      } catch (err) {
        console.error("No se pudo parsear formJson:", err);
      }
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "No se recibió ninguna imagen" },
        { status: 400 }
      );
    }

    // 1) Subir imagen al backend (/internal/uploads/image)
    const uploadBody = new FormData();

    // el backend espera el campo "file", no "image"
    uploadBody.set("file", file);

    const uploadHeaders: Record<string, string> = {};
    if (authHeader) {
      // para guards JWT
      uploadHeaders["authorization"] = authHeader;
    }
    if (INTERNAL_KEY) {
      // por si también usa ingest key
      uploadHeaders["x-ingest-key"] = INTERNAL_KEY;
    }

    const uploadRes = await fetch(buildApiUrl("/internal/uploads/image"), {
      method: "POST",
      headers: uploadHeaders,
      body: uploadBody,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => "");
      console.error(
        "Error al subir imagen:",
        uploadRes.status,
        uploadRes.statusText,
        text
      );
      return NextResponse.json(
        {
          message: "Error al subir la imagen al backend",
          statusCode: uploadRes.status,
          backend: text,
        },
        { status: 502 }
      );
    }

    const uploadJson = (await uploadRes.json()) as {
      url?: string;
      imageUrl?: string;
      path?: string;
    };

    // Puede venir como /uploads/... o como http://.../uploads/...
    const rawImageUrl = uploadJson.url ?? uploadJson.imageUrl ?? uploadJson.path;
    if (!rawImageUrl) {
      return NextResponse.json(
        { message: "El backend no devolvió URL de imagen" },
        { status: 502 }
      );
    }

    // URL pública para mostrar en el editor
    const publicImageUrl = getPublicUrl(rawImageUrl);

    // 2) Pedir sugerencias a la IA (/internal/articles/from-image-ai)
    const aiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (INTERNAL_KEY) {
      aiHeaders["x-ingest-key"] = INTERNAL_KEY;
    }
    if (authHeader) {
      aiHeaders["authorization"] = authHeader;
    }

    // sacamos imageUrl de form para que NO pise el valor real
    const { imageUrl: _formImageUrl, ...formSinImagen } = form;

    const aiPayload = {
      ...formSinImagen,
      imageUrl: rawImageUrl,
    };

    console.log(
      "[from-image-ai] rawImageUrl:",
      rawImageUrl,
      "aiPayload:",
      JSON.stringify(aiPayload)
    );

    const aiRes = await fetch(buildApiUrl("/internal/articles/from-image-ai"), {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify(aiPayload),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => "");
      console.error(
        "Error al llamar a /internal/articles/from-image-ai:",
        aiRes.status,
        aiRes.statusText,
        text
      );
      return NextResponse.json(
        {
          message: "Error al procesar la captura con IA",
          statusCode: aiRes.status,
          backend: text,
        },
        { status: 502 }
      );
    }

    const ai = (await aiRes.json()) as AiSuggestion;

    // 3) Merge de campos de texto
    const finalTitle = preferExisting(form.title, ai.title);
    const finalSummary = preferExisting(form.summary, ai.summary);
    const baseBodyHtml = preferExisting(form.bodyHtml, ai.bodyHtml);

    // 4) Armamos el bodyHtml final
    let finalBodyHtml = baseBodyHtml;
    const shouldInjectImage = !form.bodyHtml && !!baseBodyHtml;

    if (shouldInjectImage) {
      const altText =
        finalTitle ?? "Captura de pantalla de la publicación original";

      const imgTag = `<p><img src="${publicImageUrl}" alt="${escapeHtmlAttr(
        altText
      )}" /></p>\n`;

      finalBodyHtml = imgTag + (baseBodyHtml ?? "");
    }

    const merged = {
      title: finalTitle ?? "",
      summary: finalSummary ?? "",
      bodyHtml: finalBodyHtml ?? "",
      category: mergeCategory(form.category, ai.category),
      ideology: mergeIdeology(form.ideology, ai.ideology),
      sourceIdeology: preferExisting(form.sourceIdeology, ai.sourceIdeology),
      imageUrl: publicImageUrl,
    };

    return NextResponse.json(merged);
  } catch (err) {
    console.error(
      "Error inesperado en /api/editor-articles/from-image-ai:",
      err
    );
    return NextResponse.json(
      { message: "Error inesperado al procesar la captura con IA" },
      { status: 500 }
    );
  }
}
