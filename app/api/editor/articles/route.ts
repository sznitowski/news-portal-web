// app/api/editor/articles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../../lib/api";

const INGEST_KEY = process.env.INGEST_KEY;

if (!INGEST_KEY) {
  console.warn("INGEST_KEY no está definida en el front (.env.local)");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "all";
  const page = searchParams.get("page") ?? "1";
  const limit = searchParams.get("limit") ?? "20";

  const backendUrl = buildApiUrl(
    `/internal/articles?status=${encodeURIComponent(
      status,
    )}&page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
  );

  const res = await fetch(backendUrl, {
    method: "GET",
    headers: {
      "X-INGEST-KEY": INGEST_KEY ?? "",
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");

  if (!id || !action) {
    return NextResponse.json(
      { message: "id y action son requeridos" },
      { status: 400 },
    );
  }

  if (action !== "publish" && action !== "unpublish") {
    return NextResponse.json(
      { message: "action inválida (use publish o unpublish)" },
      { status: 400 },
    );
  }

  const backendUrl = buildApiUrl(`/internal/articles/${id}/${action}`);

  const res = await fetch(backendUrl, {
    method: "PATCH",
    headers: {
      "X-INGEST-KEY": INGEST_KEY ?? "",
    },
  });

  const data = await res.json().catch(() => null);

  return NextResponse.json(data, { status: res.status });
}
