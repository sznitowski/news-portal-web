// app/api/news-official-inbox/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/app/lib/api";

const INTERNAL_KEY =
  process.env.INTERNAL_INGEST_KEY ??
  process.env.INGEST_KEY ??
  "supersecreto123";

function buildHeaders(req: NextRequest) {
  const h: Record<string, string> = { "content-type": "application/json" };

  const tokenFromCookie = req.cookies.get("editor_auth")?.value;
  if (tokenFromCookie) h["authorization"] = `Bearer ${tokenFromCookie}`;

  const authHeader = req.headers.get("authorization");
  if (authHeader) h["authorization"] = authHeader;

  if (INTERNAL_KEY) h["x-ingest-key"] = INTERNAL_KEY;

  return h;
}

/**
 * GET /api/news-official-inbox?status=new&page=1&limit=30&q=...
 * -> proxy a /internal/official-social-inbox
 */
export async function GET(req: NextRequest) {
  try {
    const u = req.nextUrl;
    const qs = u.searchParams.toString();

    const res = await fetch(
      buildApiUrl(`/internal/official-social-inbox${qs ? `?${qs}` : ""}`),
      {
        method: "GET",
        headers: buildHeaders(req),
        cache: "no-store",
      },
    );

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return NextResponse.json(
        { message: "Error listando official inbox", statusCode: res.status, backend: text },
        { status: 502 },
      );
    }

    const json = text ? JSON.parse(text) : { items: [], meta: null };
    return NextResponse.json(json, { status: 200 });
  } catch (err) {
    console.error("[news-official-inbox][GET] error:", err);
    return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
  }
}

/**
 * POST /api/news-official-inbox
 * Body:
 *   { items: [...] }  o directamente [ ... ]
 * -> proxy a /internal/official-social-inbox/import
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as any;
    if (!body) return NextResponse.json({ message: "JSON inválido" }, { status: 400 });

    const items = Array.isArray(body) ? body : body.items;
    if (!Array.isArray(items)) {
      return NextResponse.json({ message: "items inválido (se espera items[])" }, { status: 400 });
    }

    const res = await fetch(buildApiUrl("/internal/official-social-inbox/import"), {
      method: "POST",
      headers: buildHeaders(req),
      body: JSON.stringify({ items }),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return NextResponse.json(
        { message: "Error importando official inbox", statusCode: res.status, backend: text },
        { status: 502 },
      );
    }

    return NextResponse.json(text ? JSON.parse(text) : { ok: true }, { status: 200 });
  } catch (err) {
    console.error("[news-official-inbox][POST] error:", err);
    return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
  }
}

/**
 * PATCH /api/news-official-inbox
 * Body: { action: "queue"|"discard"|"processed", id: 123 }
 * -> proxy a /internal/official-social-inbox/:id/:action
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as any;
    if (!body) return NextResponse.json({ message: "JSON inválido" }, { status: 400 });

    const headers = buildHeaders(req);

    const id = Number(body.id);
    const action = String(body.action || "");

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ message: "id inválido" }, { status: 400 });
    }
    if (!["queue", "discard", "processed"].includes(action)) {
      return NextResponse.json({ message: "action inválida" }, { status: 400 });
    }

    const res = await fetch(
      buildApiUrl(`/internal/official-social-inbox/${id}/${action}`),
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({}),
      },
    );

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return NextResponse.json(
        { message: "Error actualizando estado", statusCode: res.status, backend: text },
        { status: 502 },
      );
    }

    return NextResponse.json(text ? JSON.parse(text) : { ok: true }, { status: 200 });
  } catch (err) {
    console.error("[news-official-inbox][PATCH] error:", err);
    return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
  }
}
