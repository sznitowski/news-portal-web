// app/api/uploads/video/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../../lib/api";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization") || "";

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Falta el archivo de video." }, { status: 400 });
    }

    const fd = new FormData();
    fd.append("file", file);

    const backendRes = await fetch(buildApiUrl("/admin/video/upload"), {
      method: "POST",
      headers: token ? { Authorization: token } : {},
      body: fd,
    });

    const text = await backendRes.text().catch(() => "");
    let json: any = null;
    if (text) {
      try { json = JSON.parse(text); } catch {}
    }

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: "Error al subir el video al backend", statusCode: backendRes.status, backend: text },
        { status: 502 },
      );
    }

    return NextResponse.json(json ?? { raw: text }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en /api/uploads/video", err);
    return NextResponse.json({ message: "Error inesperado al subir el video" }, { status: 500 });
  }
}
