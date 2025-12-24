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

  coverOverlay?: unknown;
};

type CoverOverlaySuggestion = {
  overlayTitle?: string | null;
  overlaySubtitle?: string | null;
  tone?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  [k: string]: unknown;
};

type AiCombinedResponse = {
  title?: string;
  summary?: string;
  bodyHtml?: string;
  category?: string;
  ideology?: string;
  sourceIdeology?: string;

  imageUrl: string;
  coverOverlay: CoverOverlaySuggestion;
};

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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

function mergeCategory(userCat?: string, aiCat?: string): string {
  const u = (userCat ?? "").trim();
  const a = (aiCat ?? "").trim();

  if (!u || u === DEFAULT_CATEGORY) {
    return a || u || DEFAULT_CATEGORY;
  }
  return u;
}

function mergeIdeology(userIde?: string, aiIde?: string): string {
  const u = (userIde ?? "").trim();
  const a = (aiIde ?? "").trim();

  if (!u || u === DEFAULT_IDEOLOGY) {
    return a || u || DEFAULT_IDEOLOGY;
  }
  return u;
}

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ??
  process.env.INGEST_KEY ??
  "supersecreto123";

export async function POST(req: NextRequest) {
  try {
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
        { status: 400 },
      );
    }

    // 1) Subir imagen al backend (/internal/uploads/image)
    const uploadBody = new FormData();
    uploadBody.set("file", file);

    /**
     * ✅ IMPORTANTE:
     * "screenshot" puede no existir en tu backend y cae al default (cover).
     * Usá el kind real que mapea a /uploads/screens.
     * Probables: "screen" o "screens".
     */
    uploadBody.set("kind", "screen");

    const uploadHeaders: Record<string, string> = {};
    if (authHeader) uploadHeaders["authorization"] = authHeader;
    if (INTERNAL_KEY) uploadHeaders["x-ingest-key"] = INTERNAL_KEY;

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
        text,
      );
      return NextResponse.json(
        {
          message: "Error al subir la imagen al backend",
          statusCode: uploadRes.status,
          backend: text,
        },
        { status: 502 },
      );
    }

    const uploadJson = (await uploadRes.json()) as {
      url?: string;
      imageUrl?: string;
      path?: string;
    };

    const rawImageUrl = uploadJson.url ?? uploadJson.imageUrl ?? uploadJson.path;

    if (!rawImageUrl) {
      return NextResponse.json(
        { message: "El backend no devolvió URL de imagen" },
        { status: 502 },
      );
    }

    // 🔎 Debug útil: si igual te lo devuelve en covers, tu backend está ignorando kind
    if (rawImageUrl.includes("/uploads/covers/")) {
      console.warn(
        "[from-image-ai] ⚠️ La imagen volvió en /uploads/covers. El backend probablemente no reconoce kind='screen' o lo está mapeando mal.",
        rawImageUrl,
      );
    }

    const publicImageUrl = getPublicUrl(rawImageUrl);

    // 2) Pedir TODO JUNTO: nota + overlay
    const aiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (INTERNAL_KEY) aiHeaders["x-ingest-key"] = INTERNAL_KEY;
    if (authHeader) aiHeaders["authorization"] = authHeader;

    console.log("[from-image-ai] rawImageUrl:", rawImageUrl);

    const aiRes = await fetch(
      buildApiUrl("/internal/ai/article-and-overlay-from-image"),
      {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({ imageUrl: rawImageUrl }),
      },
    );

    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => "");
      console.error(
        "Error al llamar a /internal/ai/article-and-overlay-from-image:",
        aiRes.status,
        aiRes.statusText,
        text,
      );
      return NextResponse.json(
        {
          message: "Error al procesar la captura con IA (nota + overlay).",
          statusCode: aiRes.status,
          backend: text,
        },
        { status: 502 },
      );
    }

    const ai = (await aiRes.json()) as AiCombinedResponse;

    // 3) Merge de campos de texto
    const finalTitle = preferExisting(form.title, ai.title);
    const finalSummary = preferExisting(form.summary, ai.summary);
    const baseBodyHtml = preferExisting(form.bodyHtml, ai.bodyHtml);

    // 4) Body final con inyección de screenshot (solo si el usuario no escribió bodyHtml)
    let finalBodyHtml = baseBodyHtml;
    const shouldInjectImage = !form.bodyHtml && !!baseBodyHtml;

    if (shouldInjectImage) {
      const altText = finalTitle ?? "Captura de pantalla de la publicación original";
      const imgTag = `<p><img src="${publicImageUrl}" alt="${escapeHtmlAttr(altText)}" /></p>\n`;
      finalBodyHtml = imgTag + (baseBodyHtml ?? "");
    }

    // 5) Respuesta final
    const merged = {
      title: finalTitle ?? "",
      summary: finalSummary ?? "",
      bodyHtml: finalBodyHtml ?? "",
      category: mergeCategory(form.category, ai.category),
      ideology: mergeIdeology(form.ideology, ai.ideology),
      sourceIdeology: preferExisting(form.sourceIdeology, ai.sourceIdeology),

      // ✅ esto es la captura (screen), no una cover
      imageUrl: publicImageUrl,

      // esto sirve para precargar el editor de portada (pero no debería “convertir” la captura en cover)
      coverOverlay: ai.coverOverlay ?? null,
    };

    return NextResponse.json(merged);
  } catch (err) {
    console.error("Error inesperado en /api/editor-articles/from-image-ai:", err);
    return NextResponse.json(
      { message: "Error inesperado al procesar la captura con IA" },
      { status: 500 },
    );
  }
}
