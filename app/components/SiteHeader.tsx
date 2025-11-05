// components/SiteHeader.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type NavItem = {
  label: string;
  category: string | null;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Últimas noticias", category: null },      // antes: "Todas"
  { label: "Política", category: "politica" },
  { label: "Economía", category: "economia" },
  { label: "Internacional", category: "internacional" },
];

export default function SiteHeader() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

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
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.04em",
            marginBottom: 12,
          }}
        >
          Mi Portal de Noticias
        </h1>

        <nav
          aria-label="Secciones"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 32,
            fontSize: 15,
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
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#ffffff" : "#e5e7eb",
                  textDecoration: "none",
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
        </nav>
      </div>
    </header>
  );
}
