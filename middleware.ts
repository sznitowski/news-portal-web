// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas dentro de /admin
  const isLoginPage = pathname === "/admin/login";
  const isLogout = pathname === "/admin/logout";

  // Sólo miramos /admin/*
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const hasCookie = req.cookies.get("editor_auth")?.value === "1";

  // Si no está logueado y NO está en /admin/login -> mandarlo a login
  if (!hasCookie && !isLoginPage) {
    const url = new URL("/admin/login", req.url);
    return NextResponse.redirect(url);
  }

  // Si ya está logueado y va a /admin/login -> mandarlo al panel
  if (hasCookie && isLoginPage) {
    const url = new URL("/admin", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Sólo matchea rutas admin
export const config = {
  matcher: ["/admin/:path*"],
};
