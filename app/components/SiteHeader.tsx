// components/SiteHeader.tsx
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
        backgroundColor: "#000",
        color: "#fff",
        padding: "18px 24px 10px",
        marginBottom: 0,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.04em",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Mi Portal de Noticias
        </h1>

        <nav
          aria-label="Navegación principal"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          {/* Tabs centro */}
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
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
                    paddingBottom: 6,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#ffffff" : "#e5e7eb",
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
                        height: 2,
                        backgroundColor: "#ffffff",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Derecha: login o usuario + salir, pegado al borde del navbar */}
          <div
            style={{
              minWidth: 160,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {checkingAuth ? null : !user ? (
              <Link
                href="/login"
                style={{
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 9999,
                  border: "1px solid #e5e7eb",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  color: "#e5e7eb",
                  backgroundColor: "transparent",
                  whiteSpace: "nowrap",
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
                    letterSpacing: "0.08em",
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
                    padding: "4px 10px",
                    borderRadius: 9999,
                    border: "1px solid #e5e7eb",
                    backgroundColor: "transparent",
                    color: "#e5e7eb",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
