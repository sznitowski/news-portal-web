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
import EconomyMenu from "./economy/EconomyMenu";

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
  const pathname = usePathname();
  const router = useRouter();

  const currentCategory = searchParams.get("category");

  const [user, setUser] = useState<CurrentUser>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);


  const [panelOpen, setPanelOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);


  // ======== FLAGS DE SECCIÓN ACTIVA (links de arriba) ========
  const isHome =
    pathname === "/" && (!currentCategory || currentCategory === null);

  const isEconomy =
    currentCategory === "economia" || pathname.startsWith("/economia");

  const isPolitics =
    currentCategory === "politica" || pathname.startsWith("/politica");

  const isInternational =
    currentCategory === "internacional" ||
    pathname.startsWith("/internacional");

  // Cerrar dropdown de panel cuando cambia la ruta
  useEffect(() => {
    setPanelOpen(false);
    setMediaOpen(false);
    setRadarOpen(false);
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
    setMediaOpen(false);
    if (pathname === href) return;
    router.push(href);
  };

  // ========================
  // RENDER
  // ========================

  return (
    <>
      {/* Fila superior: sólo usuario / login */}
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
            justifyContent: "flex-end",
            gap: 16,
            fontSize: 12,
          }}
        >
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
                <>
                  <span style={{ color: "#9ca3af", fontWeight: 600 }}>
                    INVITADO
                  </span>
                  <Link
                    href="/login"
                    style={{
                      padding: "6px 18px",
                      borderRadius: 999,
                      border: "1px solid #020617",
                      backgroundColor: "#ffffff",
                      color: "#020617",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                    }}
                  >
                    INICIAR SESIÓN
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {/* Fila para el “Panel editorial” (encima del logo) */}
      {!checkingAuth && user && user.role === "ADMIN" && (
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
              padding: "6px 16px 4px",
              display: "flex",
              justifyContent: "flex-start",
              gap: 18,
              position: "relative",
            }}
          >
            {/* PANEL EDITORIAL */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setPanelOpen((o) => !o);
                  setMediaOpen(false);
                  setRadarOpen(false);
                }}
                style={{
                  position: "relative",
                  padding: "4px 2px 8px",
                  border: "none",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  color: "#020617",
                }}
              >
                PANEL EDITORIAL{" "}
                <span style={{ fontSize: 10, marginLeft: 4 }}>
                  {panelOpen ? "▲" : "▼"}
                </span>

                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 3,
                    borderRadius: 999,
                    background: "linear-gradient(90deg,#38bdf8,#6366f1,#a855f7)",
                  }}
                />
              </button>

              {panelOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    minWidth: 280,
                    borderRadius: 18,
                    border: "1px solid rgba(15,23,42,0.08)",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
                    padding: 14,
                    zIndex: 80,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => goTo("/admin/editor")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: 13,
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      Edición de notas
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
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
                      borderRadius: 12,
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      Publicar desde imagen (IA)
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Subir captura y dejar que la IA sugiera la nota.
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* PANEL MULTIMEDIA */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setMediaOpen((o) => !o);
                  setPanelOpen(false);
                  setRadarOpen(false);
                }}
                style={{
                  position: "relative",
                  padding: "4px 2px 8px",
                  border: "none",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  color: "#020617",
                }}
              >
                PANEL MULTIMEDIA{" "}
                <span style={{ fontSize: 10, marginLeft: 4 }}>
                  {mediaOpen ? "▲" : "▼"}
                </span>

                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 3,
                    borderRadius: 999,
                    background: "linear-gradient(90deg,#22c55e,#38bdf8,#a855f7)",
                  }}
                />
              </button>

              {mediaOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    minWidth: 300,
                    borderRadius: 18,
                    border: "1px solid rgba(15,23,42,0.08)",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
                    padding: 14,
                    zIndex: 80,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => goTo("/admin/multimedia/image-editor")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: 13,
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      Editor de imágenes (IA)
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Ajustar imagen para portada.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => goTo("/admin/multimedia/video-processor")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      Procesador de videos
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Subir, normalizar y renderizar (web/feed/reel).
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* PANEL RADAR */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setRadarOpen((o) => !o);
                  setPanelOpen(false);
                  setMediaOpen(false);
                }}
                style={{
                  position: "relative",
                  padding: "4px 2px 8px",
                  border: "none",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  color: "#020617",
                }}
              >
                PANEL RADAR{" "}
                <span style={{ fontSize: 10, marginLeft: 4 }}>
                  {radarOpen ? "▲" : "▼"}
                </span>

                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 3,
                    borderRadius: 999,
                    background: "linear-gradient(90deg,#f59e0b,#ef4444,#a855f7)",
                  }}
                />
              </button>

              {radarOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    minWidth: 300,
                    borderRadius: 18,
                    border: "1px solid rgba(15,23,42,0.08)",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
                    padding: 14,
                    zIndex: 80,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => goTo("/admin/news-inbox")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Bandeja de noticias</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Noticias detectadas para procesar con IA.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => goTo("/admin/news-official-inbox")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Cuentas Oficiales</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Publicaciones detectadas en cuentas oficiales para procesar con IA.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => goTo("/admin/x-posts")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Publicar en X (manual)</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Borradores listos para copiar/pegar y marcar como publicados.
                    </div>
                  </button>
                </div>
              )}


            </div>
          </div>
        </div>
      )}



      {/* Fila con logo / nombre */}
      <div
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.96), rgba(255,255,255,0))",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "14px 16px 10px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              flexDirection: "column", // fila para logo+título, claim abajo
              alignItems: "center",
              textDecoration: "none",
              color: "#020617",
              whiteSpace: "nowrap",
              gap: 4,
            }}
          >
            {/* fila: CL + CANALIBERTARIO */}
            <div
              style={{
                display: "flex",
                alignItems: "center", // CL a la misma altura que el título
                gap: 12,
              }}
            >
              {/* Isotipo CL */}
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle at 30% 20%, #ffffff, #f3f4f6 45%, #e5e7eb 70%, #d4d4d8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 25px rgba(15,23,42,0.25)",
                  border: "1px solid rgba(148,163,184,0.7)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Times New Roman', Georgia, serif",
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: "0.06em",
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 1,
                  }}
                >
                  <span style={{ color: "#8b1b2e" }}>C</span>
                  <span style={{ color: "#4c2c82" }}>L</span>
                </span>
              </span>

              {/* Logotipo CANALIBERTARIO */}
              <span
                style={{
                  fontFamily: "'Times New Roman', Georgia, serif",
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  lineHeight: 1,
                }}
              >
                <span style={{ color: "#8b1b2e" }}>CANA</span>
                <span
                  style={{
                    background:
                      "linear-gradient(90deg,#452272,#5b3a9b,#7c56c0)",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  LIBERTARIO
                </span>
              </span>
            </div>

            {/* Claim debajo, sin mover el logo */}
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.26em",
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              NOTICIAS Y ANÁLISIS ECONÓMICOS Y POLÍTICOS DESDE UNA MIRADA LIBERTARIA
            </span>
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
            let isActive = false;

            if (item.category === null) {
              isActive = isHome;
            } else if (item.category === "economia") {
              isActive = isEconomy;
            } else if (item.category === "politica") {
              isActive = isPolitics;
            } else if (item.category === "internacional") {
              isActive = isInternational;
            }

            const href = item.category ? `/?category=${item.category}` : "/";

            // Caso especial: ECONOMÍA con menú desplegable
            if (item.category === "economia") {
              return (
                <EconomyMenu
                  key={item.label}
                  isActive={isEconomy}
                />
              );
            }

            // Resto de las secciones como Link normal
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
