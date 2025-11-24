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
        console.error("[enhance] optionsJson inválido:", e);
      }
    }

    // 1) Subir imagen al backend (/internal/uploads/image)
    const uploadBody = new FormData();
    uploadBody.set("file", file);

    // si más adelante querés que el backend use estos datos, se los podés reenviar
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

    const publicUrl = getPublicUrl(rawImageUrl);

    const responsePayload: Record<string, any> = {
      enhancedImageUrl: publicUrl,
      rawImageUrl,
      message:
        "Imagen procesada correctamente. Usala como portada en tus notas.",
    };

    // devolvemos también lo que se mandó de textos para que el front lo muestre
    if (options) {
      responsePayload.overlay = {
        title: options.title ?? null,
        subtitle: options.subtitle ?? null,
        footer: options.footer ?? null,
      };
    }

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error("[enhance] Error inesperado:", err);
    return NextResponse.json(
      {
        message: "Error inesperado al procesar la imagen con IA",
        error: String(err),
      },
      { status: 500 },
    );
  }
}
