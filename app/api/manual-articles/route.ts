// app/api/manual-articles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../lib/api"; // ojo con esta ruta

interface ManualArticlePayload {
  title: string;
  summary?: string;
  bodyHtml?: string;
  category?: string;
  ideology?: string;
  publishedAt?: string;
}

export async function POST(req: NextRequest) {
  const ingestKey = process.env.INGEST_KEY;

  if (!ingestKey) {
    return NextResponse.json(
      { message: "INGEST_KEY no configurada en el front" },
      { status: 500 }
    );
  }

  let payload: ManualArticlePayload;
  try {
    payload = (await req.json()) as ManualArticlePayload;
  } catch {
    return NextResponse.json(
      { message: "JSON inválido en el body" },
      { status: 400 }
    );
  }

  if (!payload.title?.trim()) {
    return NextResponse.json(
      { message: "El título es obligatorio" },
      { status: 400 }
    );
  }

  const publishedAt =
    payload.publishedAt && !payload.publishedAt.endsWith("Z")
      ? new Date(payload.publishedAt).toISOString()
      : payload.publishedAt;

  const bodyToSend: ManualArticlePayload = {
    ...payload,
    publishedAt,
  };

  const url = buildApiUrl("/internal/articles/manual");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-INGEST-KEY": ingestKey,
    },
    body: JSON.stringify(bodyToSend),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // si no es JSON, dejamos text tal cual
  }

  if (!res.ok) {
    return NextResponse.json(
      {
        message: json?.message ?? `Error desde API (status ${res.status})`,
        raw: json ?? text,
      },
      { status: res.status }
    );
  }

  return NextResponse.json(json);
}
