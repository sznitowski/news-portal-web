// app/components/SiteHeader.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

  const [user, setUser] = useState<CurrentUser>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  // ==============================
  // Auth / usuario actual
  // ==============================
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
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  const goPanel = (path: string) => {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  const isAdmin = !!user && user.role === "ADMIN";

  // ==============================
  // Render
  // ==============================
  return (
    <>
      {/* Barra superior: botón panel / logo centrado / usuario */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(226,232,240,0.9)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "10px 16px 6px",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            columnGap: 24,
          }}
        >
          {/* IZQUIERDA: Panel editorial o Iniciar sesión */}
          <div style={{ justifySelf: "start" }}>
            {checkingAuth ? null : isAdmin ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <button
                  type="button"
                  onClick={() => setPanelOpen((o) => !o)}
                  style={{
                    fontSize: 13,
                    padding: "6px 18px",
                    borderRadius: 999,
                    border: "1px solid #111827",
                    backgroundColor: "#111827",
                    color: "#f9fafb",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 16px 40px rgba(15,23,42,0.35)",
                  }}
                >
                  PANEL EDITORIAL
                </button>

                {panelOpen && (
                  <div
                    style={{
                      position: "absolute",
                      marginTop: 8,
                      left: 0,
                      minWidth: 260,
                      borderRadius: 16,
                      border: "1px solid rgba(148,163,184,0.5)",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 22px 55px rgba(15,23,42,0.35)",
                      padding: 10,
                      zIndex: 50,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => goPanel("/admin/editor")}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#020617",
                        }}
                      >
                        Edición de notas
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                        }}
                      >
                        Crear, editar y publicar artículos.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => goPanel("/admin/from-image-ai")}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#020617",
                        }}
                      >
                        Publicar desde imagen (IA)
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                        }}
                      >
                        Subir captura y dejar que la IA sugiera la nota.
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                style={{
                  fontSize: 13,
                  padding: "6px 18px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontWeight: 600,
                  color: "#111827",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 12px 30px rgba(148,163,184,0.35)",
                }}
              >
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* CENTRO: Logo + nombre del sitio, SIEMPRE CENTRADO */}
          <div style={{ justifySelf: "center" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                color: "#020617",
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  background:
                    "linear-gradient(135deg,#22c55e,#22c55e,#8b5cf6,#0ea5e9)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#020617",
                  boxShadow: "0 16px 40px rgba(15,23,42,0.45)",
                }}
              >
                CL
              </span>
              <span>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  CANALIBERTARIO
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 11,
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: "#6b7280",
                  }}
                >
                  Noticias · Economía · Política
                </div>
              </span>
            </Link>
          </div>

          {/* DERECHA: Usuario / Invitado + salir */}
          <div style={{ justifySelf: "end" }}>
            {checkingAuth ? null : !user ? (
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                }}
              >
                Invitado
              </span>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#4b5563",
                  }}
                >
                  {user.email ?? user.name ?? "Editor"}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    fontSize: 12,
                    padding: "6px 16px",
                    borderRadius: 999,
                    border: "1px solid #020617",
                    backgroundColor: "#020617",
                    color: "#f9fafb",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de secciones (sticky) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(226,232,240,0.9)",
        }}
      >
        <nav
          aria-label="Secciones"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "6px 16px 4px",
            display: "flex",
            gap: 32,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              (item.category === null && !currentCategory) ||
              currentCategory === item.category;

            const href = item.category ? `/?category=${item.category}` : "/";

            return (
              <Link
                key={item.label}
                href={href}
                style={{
                  position: "relative",
                  padding: "8px 0 10px",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#111827" : "#6b7280",
                  textDecoration: "none",
                  borderBottom: isActive
                    ? "2px solid transparent"
                    : "2px solid transparent",
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
                      height: 2,
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg,#22c55e,#8b5cf6,#0ea5e9)",
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
