// app/articulo/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ArticleFull } from "../../types/article";
import { getArticleBySlug } from "../../lib/api";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();

  const [article, setArticle] = useState<ArticleFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function load() {
      try {
        const data = await getArticleBySlug(slug);
        if (!data) {
          setNotFound(true);
        } else {
          setArticle(data);
        }
      } catch (err) {
        console.error("error fetching article", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  if (loading) {
    return (
      <main style={{ padding: 16 }}>
        <p style={{ color: "#999" }}>Cargando nota...</p>
      </main>
    );
  }

  if (notFound || !article) {
    return (
      <main style={{ padding: 16 }}>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 600 }}>
          Artículo no encontrado
        </h1>
        <p style={{ color: "#777", marginTop: 8 }}>
          Puede haber sido removido o no está publicado.
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 16,
        maxWidth: 800,
        margin: "0 auto",
        color: "#eee",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#999",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {article.category} ·{" "}
        {new Date(article.publishedAt).toLocaleString("es-AR", {
          dateStyle: "short",
          timeStyle: "short",
        })}
      </div>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#fff",
          lineHeight: 1.2,
          marginBottom: 16,
        }}
      >
        {article.title}
      </h1>

      {article.summary ? (
        <p
          style={{
            color: "#ccc",
            fontSize: 16,
            lineHeight: 1.4,
            marginBottom: 24,
          }}
        >
          {article.summary}
        </p>
      ) : null}

      <article
        style={{
          color: "#ddd",
          fontSize: 16,
          lineHeight: 1.5,
        }}
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />
    </main>
  );
}
