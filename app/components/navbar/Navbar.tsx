"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Solo mostramos esta barra en rutas /admin
  if (!pathname.startsWith("/admin")) {
    return null;
  }

  const [open, setOpen] = React.useState(false);

  // Cada vez que cambia de ruta, cerramos el menú
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function go(href: string) {
    if (pathname === href) {
      setOpen(false);
      return;
    }
    setOpen(false);
    router.push(href);
  }

  return (
    <header
      style={{
        backgroundColor: "#020617",
        borderBottom: "1px solid rgba(31,41,55,0.9)",
      }}
    >
      <nav
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Marca + contexto */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9ca3af",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Info libertario · Panel editorial
        </div>

        {/* Dropdown + Ver portada */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Dropdown Panel editorial */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              style={{
                fontSize: 13,
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid #374151",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              Panel editorial
              <span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>
            </button>

            {open && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  right: 0,
                  minWidth: 220,
                  borderRadius: 12,
                  border: "1px solid rgba(31,41,55,0.9)",
                  backgroundColor: "#020617",
                  padding: 8,
                  boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
                  zIndex: 50,
                }}
              >
                <button
                  type="button"
                  onClick={() => go("/admin/editor")}
                  style={dropdownItemStyle}
                >
                  Edición de notas
                </button>
                <button
                  type="button"
                  onClick={() => go("/admin/from-image-ai")}
                  style={dropdownItemStyle}
                >
                  Publicar desde imagen (IA)
                </button>
              </div>
            )}
          </div>

          {/* Ver portada pública */}
          <Link
            href="/"
            style={{
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #4b5563",
              textDecoration: "none",
              color: "#e5e7eb",
              backgroundColor: "transparent",
              whiteSpace: "nowrap",
            }}
          >
            Ver portada
          </Link>
        </div>
      </nav>
    </header>
  );
}

const dropdownItemStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "6px 10px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "#e5e7eb",
  fontSize: 13,
  cursor: "pointer",
  marginBottom: 2,
};
