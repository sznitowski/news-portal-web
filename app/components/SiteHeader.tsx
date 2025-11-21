// app/components/SiteHeader.tsx
"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useState } from "react";
import { buildApiUrl } from "../lib/api";

type NavItem = {
  label: string;
  category: string | null;
};

type CurrentUser = {
  id?: number;
  email?: string;
  name?: string;
  role?: string;
} | null;

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", category: null },
  { label: "Política", category: "politica" },
  { label: "Economía", category: "economia" },
  { label: "Internacional", category: "internacional" },
];

export default function SiteHeader() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  // Cerrar dropdown de panel cuando cambia la ruta
  useEffect(() => {
    setPanelOpen(false);
  }, [pathname]);

  // Chequeo de sesión
  useEffect(() => {
    async function checkAuth() {
      try {
        if (typeof window === "undefined") return;

        const token = window.localStorage.getItem("news_access_token");
        if (!token) {
          setUser(null);
          setCheckingAuth(false);
          return;
        }

        const res = await fetch(buildApiUrl("/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json().catch(() => null);
          setUser(data ?? null);
        }
      } catch (e) {
        console.error("Error al chequear auth", e);
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("news_access_token");
        window.localStorage.removeItem("news_user");
        document.cookie =
          "editor_auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      setUser(null);
      window.location.href = "/";
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  const goTo = (href: string) => {
    setPanelOpen(false);
    if (pathname === href) return;
    router.push(href);
  };

  // ========================
  // RENDER
  // ========================

  return (
    <>
      {/* Fila superior: botones (no sticky) */}
      <header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(226,232,240,0.9)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            fontSize: 12,
          }}
        >
          {/* Izquierda: Panel editorial o Iniciar sesión */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!checkingAuth && user && user.role === "ADMIN" && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setPanelOpen((o) => !o)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 999,
                    border: "1px solid #020617",
                    backgroundColor: "#020617",
                    color: "#f9fafb",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.35)",
                  }}
                >
                  PANEL EDITORIAL{" "}
                  <span style={{ fontSize: 10 }}>{panelOpen ? "▲" : "▼"}</span>
                </button>

                {panelOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "110%",
                      left: 0,
                      minWidth: 260,
                      borderRadius: 16,
                      border: "1px solid rgba(15,23,42,0.12)",
                      backgroundColor: "#020617",
                      boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
                      padding: 10,
                      zIndex: 60,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => goTo("/admin/editor")}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: "transparent",
                        color: "#e5e7eb",
                        fontSize: 13,
                        cursor: "pointer",
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>Edición de notas</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginTop: 2,
                        }}
                      >
                        Crear, editar y publicar artículos.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => goTo("/admin/from-image-ai")}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: "transparent",
                        color: "#e5e7eb",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        Publicar desde imagen (IA)
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginTop: 2,
                        }}
                      >
                        Subir captura y dejar que la IA sugiera la nota.
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {!checkingAuth && !user && (
              <Link
                href="/login"
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "1px solid #020617",
                  backgroundColor: "#ffffff",
                  color: "#020617",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                }}
              >
                INICIAR SESIÓN
              </Link>
            )}
          </div>

          {/* Derecha: usuario o invitado */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#4b5563",
            }}
          >
            {!checkingAuth && user ? (
              <>
                <span style={{ color: "#020617", fontWeight: 600 }}>
                  {user.email ?? user.name ?? "Editor"}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: "6px 18px",
                    borderRadius: 999,
                    border: "1px solid #020617",
                    backgroundColor: "#020617",
                    color: "#f9fafb",
                    fontWeight: 600,
                    cursor: "pointer",
                    letterSpacing: "0.18em",
                  }}
                >
                  SALIR
                </button>
              </>
            ) : (
              !checkingAuth && (
                <span style={{ color: "#9ca3af", fontWeight: 600 }}>
                  INVITADO
                </span>
              )
            )}
          </div>
        </div>
      </header>

      {/* Fila con logo / nombre (no sticky, fondo muy suave y casi transparente) */}
      <div
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.96), rgba(255,255,255,0))",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "10px 16px 6px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "#020617",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg,#38bdf8,#6366f1,#a855f7,#22c55e)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 16,
                color: "#0b1120",
                boxShadow: "0 10px 25px rgba(15,23,42,0.25)",
              }}
            >
              CL
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                }}
              >
                CANALIBERTARIO
              </span>
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.26em",
                  color: "#6b7280",
                }}
              >
                NOTICIAS · ECONOMÍA · POLÍTICA
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Navegación principal (sticky) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(226,232,240,0.9)",
          boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
        }}
      >
        <nav
          aria-label="Navegación principal"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "6px 16px 8px",
            display: "flex",
            justifyContent: "center",
            gap: 28,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              (item.category === null && !currentCategory) ||
              currentCategory === item.category;

            const href = item.category
              ? `/?category=${item.category}`
              : "/";

            return (
              <Link
                key={item.label}
                href={href}
                style={{
                  position: "relative",
                  paddingBottom: 6,
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#020617" : "#6b7280",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 3,
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg,#38bdf8,#6366f1,#a855f7)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
