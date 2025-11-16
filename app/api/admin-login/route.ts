// app/api/admin-login/route.ts
import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || "cambiame-123";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: "" }));

  if (!password || password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, message: "Clave incorrecta" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });

  // Cookie simple para “loguear” al editor
  res.cookies.set("editor_auth", "1", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    // secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  return res;
}
