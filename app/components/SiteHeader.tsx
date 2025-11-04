"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const CATEGORY_ITEMS = [
  { key: "ALL", label: "Todas" },
  { key: "politica", label: "Política" },
  { key: "economia", label: "Economía" },
  { key: "internacional", label: "Internacional" },
];

export default function SiteHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentCategory = searchParams.get("category") ?? "ALL";

  function handleCategoryClick(key: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "ALL") {
      params.delete("category");
    } else {
      params.set("category", key);
    }

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <header style={{ backgroundColor: "#000", color: "#fff" }}>
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "16px 16px 20px",
          textAlign: "center",
        }}
      >
        {/* Título principal */}
        <Link
          href="/"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "#fff",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Mi Portal de Noticias
        </Link>

        {/* Navegación de categorías debajo del título */}
        <nav
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "center",
            gap: 24,
            fontSize: 14,
          }}
        >
          {CATEGORY_ITEMS.map((item) => {
            const active = currentCategory === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleCategoryClick(item.key)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  paddingBottom: 4,
                  color: active ? "#ffffff" : "#d1d5db",
                  borderBottom: active
                    ? "2px solid #ffffff"
                    : "2px solid transparent",
                  fontSize: 14,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
