// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      style={{
        fontSize: 14,
        padding: "6px 12px",
        borderRadius: 999,
        textDecoration: "none",
        color: active ? "#0f172a" : "#e5e7eb",
        backgroundColor: active ? "#e5e7eb" : "transparent",
        transition: "background-color 0.15s ease, color 0.15s ease",
      }}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(15,23,42,0.9)",
        borderBottom: "1px solid rgba(148,163,184,0.3)",
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Marca / logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/"
            style={{
              fontWeight: 700,
              letterSpacing: "0.08em",
              fontSize: 14,
              color: "#e5e7eb",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            INFO LIBERTARIO
          </Link>
        </div>

        {/* Links (después filtramos por rol) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <NavLink href="/">Portada</NavLink>
          <NavLink href="/admin/manual">Cargar desde imagen</NavLink>
        </div>
      </nav>
    </header>
  );
}
