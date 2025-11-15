// app/sections/CasaRosadaStrip.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildApiUrl } from "../lib/api";

type ArticleSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: string;
};

export default function CasaRosadaStrip() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("limit", "5");
      params.set("sourceId", "2"); // Casa Rosada

      const res = await fetch(buildApiUrl("/articles", params), {
        cache: "no-store",
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data: ArticleSummary[] = await res.json();
      if (!cancelled) {
        setArticles(data);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p style={{ color: "#6b7280" }}>Cargando Casa Rosada...</p>;

  if (articles.length === 0)
    return <p style={{ color: "#9ca3af" }}>No hay artículos de Casa Rosada.</p>;

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto 24px" }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        Desde Casa Rosada
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
        {articles.map((a) => (
          <li key={a.id}>
            <Link
              href={`/article/${a.slug}`}
              style={{ fontWeight: 600, textDecoration: "none", color: "#111827" }}
            >
              {a.title}
            </Link>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {new Date(a.publishedAt).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
