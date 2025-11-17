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

  // Chequear si hay sesión activa contra el backend (/auth/me)
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch(buildApiUrl("/auth/me"), {
          credentials: "include",
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      // usamos el mismo endpoint que en /admin
      await fetch("/admin/logout", { method: "POST" });
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
        padding: "20px 16px 12px",
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
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Mi Portal de Noticias
        </h1>

        <nav
          aria-label="Navegación principal"
          style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr 160px",
            alignItems: "center",
          }}
        >
          {/* Izquierda: login o usuario + logout */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            {checkingAuth ? null : user ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#e5e7eb",
                    whiteSpace: "nowrap",
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
                    whiteSpace: "nowrap",
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
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
            )}
          </div>

          {/* Tabs centro */}
          <div
            style={{
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

          {/* Derecha: por ahora vacío (futuro: búsqueda, filtros, etc.) */}
          <div />
        </nav>
      </div>
    </header>
  );
}
