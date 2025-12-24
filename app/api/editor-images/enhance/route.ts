// app/api/editor-images/enhance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, getPublicUrl } from "../../../lib/api";

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ?? process.env.INGEST_KEY ?? "supersecreto123";

function buildAuthHeaders(req: NextRequest, tokenFromForm?: string | null) {
  const headers: Record<string, string> = {};

  const tokenFromCookie = req.cookies.get("editor_auth")?.value;
  const token = (tokenFromForm && tokenFromForm.trim()) || tokenFromCookie;

  if (token) headers["authorization"] = `Bearer ${token}`;
  if (INTERNAL_KEY) headers["x-ingest-key"] = INTERNAL_KEY;

  return headers;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // ✅ aceptar ambos nombres (compat)
    const file = (formData.get("file") ?? formData.get("image")) as unknown;
    const optionsJsonRaw = formData.get("optionsJson") as string | null;
    const accessToken = formData.get("accessToken") as string | null;

    // 👇 kind puede venir vacío / null
    const kindFromForm = (formData.get("kind") as string | null)?.trim() || null;

    // ✅ IMPORTANTÍSIMO:
    // enhance = "procesar" => si no me pasás kind explícito, asumo COVER.
    // Si desde algún lugar querés subir RAW, mandás kind=raw.
    const finalKind = (kindFromForm?.length ? kindFromForm : "cover") as string;

    if (accessToken) formData.delete("accessToken");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Falta la imagen en el campo 'file' (o 'image')." },
        { status: 400 },
      );
    }

    // (Opcional) parse para overlay de respuesta
    let options: any = null;
    if (optionsJsonRaw) {
      try {
        options = JSON.parse(optionsJsonRaw);
      } catch (e) {
        console.error("[enhance] optionsJson inválido:", e);
      }
    }

    // 1) Subir imagen al backend (/internal/uploads/image)
    const uploadBody = new FormData();

    // ✅ backend Nest espera FileInterceptor('file')
    uploadBody.set("file", file);

    if (optionsJsonRaw) uploadBody.set("optionsJson", optionsJsonRaw);

    // ✅ siempre mandamos kind (cover por defecto)
    uploadBody.set("kind", finalKind);

    const headers = buildAuthHeaders(req, accessToken);

    const uploadRes = await fetch(buildApiUrl("/internal/uploads/image"), {
      method: "POST",
      headers,
      body: uploadBody,
      // @ts-ignore
      duplex: "half",
    });

    const rawText = await uploadRes.text().catch(() => "");

    if (!uploadRes.ok) {
      console.error(
        "[enhance] Error backend uploads:",
        uploadRes.status,
        uploadRes.statusText,
        rawText,
      );
      return NextResponse.json(
        {
          message: "Error al subir/procesar la imagen en el backend",
          statusCode: uploadRes.status,
          backend: rawText,
        },
        { status: 502 },
      );
    }

    const uploadJson = rawText ? (JSON.parse(rawText) as any) : {};

    const finalBackendUrl =
      uploadJson.coverUrl ?? uploadJson.url ?? uploadJson.rawUrl ?? null;

    if (!finalBackendUrl) {
      console.error("[enhance] Backend no devolvió URL usable:", uploadJson);
      return NextResponse.json(
        {
          message: "La imagen se subió, pero el backend no devolvió una URL válida.",
          backend: uploadJson,
        },
        { status: 500 },
      );
    }

    const enhancedImageUrl = getPublicUrl(finalBackendUrl);

    const overlay =
      options && typeof options === "object"
        ? {
            title: options.title ?? options.overlay?.title ?? null,
            subtitle: options.subtitle ?? options.overlay?.subtitle ?? null,
            footer: options.footer ?? options.overlay?.footer ?? null,
          }
        : undefined;

    // ✅ normalizamos URLs específicas (si vienen)
    const type = uploadJson.type ?? null;
    const coverUrl = uploadJson.coverUrl ? getPublicUrl(uploadJson.coverUrl) : null;
    const rawUrl = uploadJson.rawUrl ? getPublicUrl(uploadJson.rawUrl) : null;

    // ✅ URL canónica para el front según el tipo
    const imageUrl =
      type === "raw"
        ? rawUrl || enhancedImageUrl
        : type === "cover"
          ? coverUrl || enhancedImageUrl
          : enhancedImageUrl;

    return NextResponse.json(
      {
        enhancedImageUrl, // compat
        imageUrl, // ✅ usar esto en full/embed
        message:
          uploadJson.message ??
          (type === "cover"
            ? "Imagen procesada y lista para usar como portada."
            : "Imagen subida como RAW, sin procesamiento."),
        overlay,
        type,
        coverUrl,
        rawUrl,

        // ✅ debug
        coverError: uploadJson.coverError ?? null,

        // ✅ extra: para confirmar qué mandó el front
        requestedKind: finalKind,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[enhance] Error inesperado:", err);
    return NextResponse.json(
      { message: "Error inesperado procesando la imagen." },
      { status: 500 },
    );
  }
}
