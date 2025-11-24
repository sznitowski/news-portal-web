// app/api/editor-images/enhance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, getPublicUrl } from "../../../lib/api";

// misma key que usás para /internal/articles
const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ?? process.env.INGEST_KEY ?? "supersecreto123";

/**
 * Construye los headers de auth para hablar con el backend Nest:
 * - Intenta usar un accessToken que vino en el formData (enviado desde el front).
 * - Si no hay, intenta leer la cookie HTTP-only "editor_auth".
 * - Siempre agrega el x-ingest-key si está configurado.
 */
function buildAuthHeaders(req: NextRequest, tokenFromForm?: string | null) {
  const headers: Record<string, string> = {};

  const tokenFromCookie = req.cookies.get("editor_auth")?.value;
  const token = (tokenFromForm && tokenFromForm.trim()) || tokenFromCookie;

  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  if (INTERNAL_KEY) {
    headers["x-ingest-key"] = INTERNAL_KEY;
  }

  return headers;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("image");
    const optionsJson = formData.get("optionsJson") as string | null;
    const accessToken = formData.get("accessToken") as string | null;

    // ya no necesitamos que llegue al backend
    if (accessToken) {
      formData.delete("accessToken");
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Falta la imagen en el campo 'image'." },
        { status: 400 },
      );
    }

    let options: any = null;
    if (optionsJson) {
      try {
        options = JSON.parse(optionsJson);
      } catch (e) {
        console.error("[enhance] optionsJson inválido en el front:", e);
      }
    }

    // 1) Subir imagen al backend (/internal/uploads/image)
    const uploadBody = new FormData();
    uploadBody.set("file", file);

    // reenviamos las opciones para que el backend pinte los textos
    if (options) {
      uploadBody.set("optionsJson", JSON.stringify(options));
    }

    const headers = buildAuthHeaders(req, accessToken);

    const uploadRes = await fetch(buildApiUrl("/internal/uploads/image"), {
      method: "POST",
      headers,
      body: uploadBody,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => "");
      console.error(
        "[enhance] Error al subir imagen:",
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
      success?: boolean;
      filename?: string;
      rawUrl?: string | null;
      coverUrl?: string | null;
      url?: string | null;
      type?: "raw" | "cover" | string;
      message?: string;
    };

    // Preferimos la cover; si algo falló, usamos el URL genérico o el raw
    const finalBackendUrl =
      uploadJson.coverUrl || uploadJson.url || uploadJson.rawUrl;

    if (!finalBackendUrl) {
      console.error("[enhance] Backend no devolvió ninguna URL usable:", uploadJson);
      return NextResponse.json(
        {
          message:
            "La imagen se subió, pero el backend no devolvió una URL válida.",
        },
        { status: 500 },
      );
    }

    const enhancedImageUrl = getPublicUrl(finalBackendUrl);

    // Armamos overlay de respuesta para que el front sepa qué se usó
    const overlay =
      options && typeof options === "object"
        ? {
            title:
              options.title ??
              options.overlay?.title ??
              null,
            subtitle:
              options.subtitle ??
              options.overlay?.subtitle ??
              null,
            footer:
              options.footer ??
              options.overlay?.footer ??
              null,
          }
        : undefined;

    const message =
      uploadJson.message ??
      (uploadJson.type === "cover"
        ? "Imagen procesada y lista para usar como portada."
        : "Imagen subida correctamente.");

    return NextResponse.json(
      {
        enhancedImageUrl,
        message,
        overlay,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[enhance] Error inesperado:", err);
    return NextResponse.json(
      {
        message: "Error inesperado procesando la imagen.",
      },
      { status: 500 },
    );
  }
}
