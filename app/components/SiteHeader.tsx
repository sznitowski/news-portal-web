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
  { label: "Últimas noticias", category: null },
  { label: "Política", category: "politica" },
  { label: "Economía", category: "economia" },
  { label: "Internacional", category: "internacional" },
];

export default function SiteHeader() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const [user, setUser] = useState<CurrentUser>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

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

  return (
    <header
      style={{
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: "14px 24px",
        borderBottom: "1px solid rgba(15,23,42,0.9)",
        boxShadow: "0 14px 40px rgba(15,23,42,0.9)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 28,
        }}
      >
        {/* Marca izquierda */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background:
                "linear-gradient(135deg,#38bdf8,#6366f1,#a855f7,#22c55e)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16,
              color: "#0b1120",
              boxShadow: "0 10px 25px rgba(15,23,42,0.7)",
            }}
          >
            Mi
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Portal de Noticias
          </span>
        </Link>

        {/* Tabs centro */}
        <nav
          aria-label="Navegación principal"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            gap: 28,
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
                  paddingBottom: 6,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#f9fafb" : "#9ca3af",
                  textDecoration: "none",
                  textTransform: "none",
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
                      height: 2,
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

        {/* Derecha: panel editorial + login/usuario */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 160,
            justifyContent: "flex-end",
          }}
        >
          {/* Botón Panel editorial solo para ADMIN */}
          {user && user.role === "ADMIN" && (
            <Link
              href="/admin"
              style={{
                fontSize: 11,
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.9)",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 600,
                color: "#e5e7eb",
                background:
                  "radial-gradient(120% 120% at 0% 0%,#1e293b 0,#020617 60%,#020617 100%)",
                whiteSpace: "nowrap",
              }}
            >
              Panel editorial
            </Link>
          )}

          {checkingAuth ? null : !user ? (
            <Link
              href="/login"
              style={{
                fontSize: 11,
                padding: "6px 16px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.9)",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 600,
                color: "#e5e7eb",
                background:
                  "radial-gradient(120% 120% at 0% 0%,#0f172a 0,#020617 60%,#020617 100%)",
              }}
            >
              Iniciar sesión
            </Link>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  color: "#e5e7eb",
                }}
              >
                {user.name ?? user.email ?? "Editor"}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  fontSize: 11,
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(248,250,252,0.9)",
                  backgroundColor: "transparent",
                  color: "#e5e7eb",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
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
    </header>
  );
}
