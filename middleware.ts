// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sólo protegemos /admin/*
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const hasCookie = req.cookies.get("editor_auth")?.value === "1";

  // Si no está logueado -> mandar a /login (NO /admin/login)
  if (!hasCookie) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  // Si tiene cookie, pasa
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
