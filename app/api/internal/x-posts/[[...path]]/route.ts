// app/api/internal/x-posts/[[...path]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { API_BASE as FALLBACK_API_BASE } from "@/app/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  FALLBACK_API_BASE ??
  "http://127.0.0.1:5001";

async function pass(res: Response) {
  const text = await res.text().catch(() => "");
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

function buildTarget(req: NextRequest, pathParts?: string[]) {
  const subPath = (pathParts ?? []).join("/");
  const qs = req.nextUrl.searchParams.toString();

  // ✅ apunta a tu backend X inbox
  const base = `${API_BASE}/internal/x/inbox`;

  // si no hay subPath -> /internal/x/inbox
  // si hay subPath -> /internal/x/inbox/123/queue
  const url = `${base}${subPath ? `/${subPath}` : ""}${qs ? `?${qs}` : ""}`;
  return url;
}

function buildHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};

  const tokenFromCookie = req.cookies.get("editor_auth")?.value;
  if (tokenFromCookie) headers["authorization"] = `Bearer ${tokenFromCookie}`;

  const key = process.env.INTERNAL_INGEST_KEY ?? process.env.INGEST_KEY ?? "";
  if (key) headers["x-ingest-key"] = key;

  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  return headers;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const target = buildTarget(req, path);
  const r = await fetch(target, {
    method: "GET",
    headers: buildHeaders(req),
    cache: "no-store",
  });
  return pass(r);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const target = buildTarget(req, path);
  const body = await req.text().catch(() => "");

  const r = await fetch(target, {
    method: "POST",
    headers: buildHeaders(req),
    body: body || undefined,
    cache: "no-store",
  });

  return pass(r);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const target = buildTarget(req, path);
  const body = await req.text().catch(() => "");

  const r = await fetch(target, {
    method: "PATCH",
    headers: buildHeaders(req),
    body: body || undefined,
    cache: "no-store",
  });

  return pass(r);
}
