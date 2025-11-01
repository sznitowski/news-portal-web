// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Tipo básico que viene de GET /articles
type ArticleSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  ideology: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export default function HomePage() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5001/articles", {
          // importante para que Next no intente cachear en server
          cache: "no-store",
        });
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        console.error("error fetching /articles", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: 16 }}>
        <p style={{ color: "#999" }}>Cargando...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
        Últimas noticias
      </h1>

      {articles.length === 0 && (
        <p style={{ color: "#999" }}>No hay artículos publicados.</p>
      )}

      <ul style={{ display: "grid", gap: 24, listStyle: "none", padding: 0 }}>
        {articles.map((a) => (
          <li
            key={a.id}
            style={{
              border: "1px solid #333",
              borderRadius: 8,
              padding: 16,
              backgroundColor: "#111",
              color: "#eee",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#999",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {a.category} ·{" "}
              {new Date(a.publishedAt).toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </div>

            <Link
              href={`/articulo/${a.slug}`}
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
              }}
            >
              {a.title}
            </Link>

            {a.summary ? (
              <p
                style={{
                  color: "#ccc",
                  fontSize: 14,
                  marginTop: 8,
                  lineHeight: 1.4,
                }}
              >
                {a.summary}
              </p>
            ) : (
              <p
                style={{
                  color: "#444",
                  fontSize: 14,
                  marginTop: 8,
                  fontStyle: "italic",
                }}
              >
                (sin resumen)
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
