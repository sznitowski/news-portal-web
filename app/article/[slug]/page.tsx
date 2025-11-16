// app/article/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { buildApiUrl } from "../../lib/api";
import { formatDate } from "../../lib/formatDate";

type ArticleDetail = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  bodyHtml: string | null;
  category: string | null;
  ideology: string | null;
  sourceIdeology?: string | null; // opcional, por si lo querés usar después
  publishedAt: string | null;
};

type ArticleListItem = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  ideology: string | null;
  sourceIdeology?: string | null;
  publishedAt: string | null;
};

const cardStyle: CSSProperties = {
  borderRadius: 18,
  backgroundColor: "#f9fafb",
  padding: 24,
  boxShadow: "0 22px 45px -22px rgba(15,23,42,0.45)",
};

const asideCardStyle: CSSProperties = {
  borderRadius: 18,
  backgroundColor: "#f9fafb",
  padding: 16,
  boxShadow: "0 18px 35px -20px rgba(15,23,42,0.35)",
};

// Mostrar ideología solo cuando sea política y no sea neutral
function shouldShowIdeology(
  category: string | null,
  ideology: string | null
): boolean {
  if (!category || !ideology) return false;
  const cat = category.toLowerCase();
  const ide = ideology.toLowerCase();

  if (ide === "neutral") return false;
  if (cat !== "politica") return false;

  return true;
}

export default async function ArticlePage({
  params,
}: {
  // 👈 importante: Promise
  params: Promise<{ slug: string }>;
}) {
  // 👈 importante: await
  const { slug } = await params;

  // --- detalle del artículo ---
  const detailUrl = buildApiUrl(`/articles/${encodeURIComponent(slug)}`);
  const detailRes = await fetch(detailUrl, { cache: "no-store" });

  if (detailRes.status === 404) {
    notFound();
  }
  if (!detailRes.ok) {
    throw new Error("Error al cargar el artículo");
  }

  const article: ArticleDetail = await detailRes.json();

  // --- más artículos de la misma categoría ---
  const moreUrl = buildApiUrl(
    `/articles?limit=4&page=1&category=${encodeURIComponent(
      article.category ?? ""
    )}`
  );
  const moreRes = await fetch(moreUrl, { cache: "no-store" });

  let moreArticles: ArticleListItem[] = [];
  if (moreRes.ok) {
    const list: ArticleListItem[] = await moreRes.json();
    moreArticles = list.filter((a) => a.slug !== article.slug);
  }

  const publishedAtLabel = article.publishedAt
    ? formatDate(article.publishedAt)
    : null;

  const categoryLabel = (article.category ?? "sin categoría").toUpperCase();
  const showIdeology = shouldShowIdeology(article.category, article.ideology);

  return (
    <main
      style={{
        padding: "32px 24px 64px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* volver a portada */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/"
          style={{
            fontSize: 14,
            color: "#e5e7eb",
            textDecoration: "none",
          }}
        >
          ← Volver a la portada
        </Link>
      </div>

      {/* barra negra con meta */}
      <section
        style={{
          backgroundColor: "#020617",
          color: "#e5e7eb",
          padding: "10px 16px",
          fontSize: 12,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <span>
          {categoryLabel}
          {showIdeology && (
            <>
              {" · "}
              <span>({article.ideology})</span>
            </>
          )}
        </span>
        {publishedAtLabel && <span>{publishedAtLabel}</span>}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 1.8fr)",
          gap: 24,
        }}
      >
        {/* columna principal */}
        <article style={cardStyle}>
          <h1
            style={{
              fontSize: 32,
              lineHeight: 1.2,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {article.title}
          </h1>

          {article.summary && (
            <p
              style={{
                fontSize: 16,
                color: "#4b5563",
                marginBottom: 24,
              }}
            >
              {article.summary}
            </p>
          )}

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#111827",
            }}
            dangerouslySetInnerHTML={{ __html: article.bodyHtml ?? "" }}
          />

          <p
            style={{
              marginTop: 24,
              fontSize: 13,
              color: "#6b7280",
              borderTop: "1px solid #e5e7eb",
              paddingTop: 12,
            }}
          >
            {publishedAtLabel && (
              <>
                Publicado: {publishedAtLabel}
                {" · "}
              </>
            )}
            <span
              style={{
                fontStyle: "italic",
                color: "#9ca3af",
              }}
            >
              Slug: {article.slug}
            </span>
          </p>
        </article>

        {/* columna lateral */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Más sobre la categoría */}
          <div style={asideCardStyle}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Más sobre {article.category?.toLowerCase() ?? "esta categoría"}
            </h2>
            {moreArticles.length === 0 ? (
              <p style={{ fontSize: 14, color: "#6b7280" }}>
                No hay más artículos en esta categoría.
              </p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 8,
                }}
              >
                {moreArticles.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/article/${a.slug}`}
                      style={{
                        fontSize: 14,
                        color: "#1d4ed8",
                        textDecoration: "none",
                      }}
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Titulares rápidos */}
          <div style={asideCardStyle}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Titulares rápidos
            </h2>
            <ul
              style={{
                padding: 0,
                listStyle: "none",
                display: "grid",
                gap: 10,
              }}
            >
              {moreArticles.map((a, idx) => (
                <li key={a.id} style={{ fontSize: 13 }}>
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: 18,
                      marginRight: 4,
                      color: "#9ca3af",
                    }}
                  >
                    {idx + 1}.
                  </span>
                  <Link
                    href={`/article/${a.slug}`}
                    style={{ color: "#111827", textDecoration: "none" }}
                  >
                    {a.title}
                  </Link>
                  {a.publishedAt && (
                    <div style={{ color: "#9ca3af", fontSize: 12 }}>
                      {formatDate(a.publishedAt)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
