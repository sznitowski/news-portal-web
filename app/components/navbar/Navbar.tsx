// app/components/navbar/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();

  const active =
    pathname === href ||
    // activo también si estás en una subruta, ej: /admin/articles/new
    (pathname.startsWith(href) && href !== "/");

  return (
    <Link
      href={href}
      style={{
        fontSize: 13,
        padding: "4px 10px",
        borderRadius: 999,
        textDecoration: "none",
        color: active ? "#020617" : "#e5e7eb",
        backgroundColor: active ? "#e5e7eb" : "transparent",
        border: active ? "1px solid #e5e7eb" : "1px solid transparent",
        transition: "background-color 0.15s ease, color 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  // 🔴 Ocultamos COMPLETAMENTE el navbar si no estás en /admin
  if (!pathname.startsWith("/admin")) {
    return null;
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

        {/* Accesos de administración */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <NavLink href="/admin">Panel editorial</NavLink>
          <NavLink href="/admin/articles/new">Publicar nota</NavLink>
          <NavLink href="/admin/manual">Imagen (IA)</NavLink>
          <NavLink href="/">Ver portada</NavLink>
        </div>
      </nav>
    </header>
  );
}
