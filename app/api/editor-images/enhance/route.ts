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

// ✅ GET:
// - si viene ?proxyUrl=... => proxy image (evita CORS en el client)
// - si no => lista biblioteca (/internal/uploads/images)
export async function GET(req: NextRequest) {
  try {
    const u = req.nextUrl;

    const proxyUrl = (u.searchParams.get("proxyUrl") ?? "").trim();
    if (proxyUrl) {
      // 🔒 allowlist: solo URLs http(s) o rutas /uploads/*
      const isHttp = /^https?:\/\//i.test(proxyUrl);
      const isUploads = proxyUrl.startsWith("/uploads/");

      if (!isHttp && !isUploads) {
        return NextResponse.json(
          { message: "proxyUrl inválida (solo http(s) o /uploads/..)" },
          { status: 400 },
        );
      }

      const abs = isUploads ? getPublicUrl(proxyUrl) : proxyUrl;

      const res = await fetch(abs, { method: "GET" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return NextResponse.json(
          {
            message: "No se pudo descargar la imagen (proxy)",
            statusCode: res.status,
            backend: t,
          },
          { status: 502 },
        );
      }

      const contentType = res.headers.get("content-type") || "application/octet-stream";
      const buf = Buffer.from(await res.arrayBuffer());

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "content-type": contentType,
          "cache-control": "public, max-age=60",
        },
      });
    }

    // ✅ biblioteca
    const scope = (u.searchParams.get("scope") ?? "raw").trim();
    const q = (u.searchParams.get("q") ?? "").trim();
    const category = (u.searchParams.get("category") ?? "").trim();
    const group = (u.searchParams.get("group") ?? "").trim();
    const limit = (u.searchParams.get("limit") ?? "300").trim();

    const qs = new URLSearchParams();
    if (scope) qs.set("scope", scope);
    if (q) qs.set("q", q);
    if (category) qs.set("category", category);
    if (group) qs.set("group", group);
    if (limit) qs.set("limit", limit);

    const headers = buildAuthHeaders(req, null);

    const listRes = await fetch(buildApiUrl(`/internal/uploads/images?${qs.toString()}`), {
      method: "GET",
      headers,
    });

    const rawText = await listRes.text().catch(() => "");
    if (!listRes.ok) {
      return NextResponse.json(
        { message: "Error listando biblioteca", statusCode: listRes.status, backend: rawText },
        { status: 502 },
      );
    }

    const json = rawText ? JSON.parse(rawText) : { items: [] };
    return NextResponse.json(json, { status: 200 });
  } catch (err) {
    console.error("[enhance][GET] error:", err);
    return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
  }
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
