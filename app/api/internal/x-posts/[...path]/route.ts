// app/api/internal/x-posts/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL; // ej: http://127.0.0.1:5001

async function pass(res: Response) {
  const text = await res.text().catch(() => "");
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

function buildTarget(req: NextRequest, pathParts: string[]) {
  const url = req.nextUrl;
  const subPath = (pathParts ?? []).join("/");
  const qs = url.searchParams.toString();
  return `${API_BASE}/internal/x-posts/${subPath}${qs ? `?${qs}` : ""}`;
}

function getAuth(req: NextRequest) {
  return req.headers.get("authorization") ?? "";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const target = buildTarget(req, path ?? []);

  const r = await fetch(target, {
    method: "GET",
    headers: { authorization: getAuth(req) },
    cache: "no-store",
  });

  return pass(r);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const target = buildTarget(req, path ?? []);

  const r = await fetch(target, {
    method: "POST",
    headers: { authorization: getAuth(req) },
    cache: "no-store",
  });

  return pass(r);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const target = buildTarget(req, path ?? []);
  const body = await req.text().catch(() => "");

  const r = await fetch(target, {
    method: "PATCH",
    headers: {
      authorization: getAuth(req),
      "content-type": "application/json",
    },
    body: body || "{}",
    cache: "no-store",
  });

  return pass(r);
}
