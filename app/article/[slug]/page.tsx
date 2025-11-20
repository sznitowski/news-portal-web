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
  sourceIdeology?: string | null;
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

type ArticlesResponse = {
  items?: ArticleListItem[];
  meta?: unknown;
};

const mainCard: CSSProperties = {
  borderRadius: 28,
  padding: 32,
  background:
    "radial-gradient(circle at 0% 0%, rgba(56,189,248,0.10), transparent 55%), #020617",
  color: "#e5e7eb",
  boxShadow: "0 40px 80px rgba(15,23,42,0.9)",
};

const asideCard: CSSProperties = {
  borderRadius: 20,
  padding: 18,
  backgroundColor: "#020617",
  border: "1px solid rgba(148,163,184,0.25)",
  boxShadow: "0 24px 60px rgba(15,23,42,0.7)",
};

const metaPill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  backgroundColor: "rgba(15,23,42,0.8)",
  border: "1px solid rgba(148,163,184,0.6)",
  color: "#e5e7eb",
};

// Mostrar ideología sólo cuando sea política y no neutral
function shouldShowIdeology(category: string | null, ideology: string | null) {
  if (!category || !ideology) return false;
  const cat = category.toLowerCase();
  const ide = ideology.toLowerCase();
  if (cat !== "politica") return false;
  if (ide === "neutral") return false;
  return true;
}

export default async function ArticlePage({
  params,
}: {
  // 👈 en Next 16 params es un Promise
  params: Promise<{ slug: string }>;
}) {
  // 👇 lo resolvemos antes de usarlo
  const { slug } = await params;

  // --- detalle del artículo ---
  const detailUrl = buildApiUrl(`/articles/${encodeURIComponent(slug)}`);
  const detailRes = await fetch(detailUrl, { cache: "no-store" });

  if (detailRes.status === 404) notFound();
  if (!detailRes.ok) throw new Error("Error al cargar el artículo");

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
    const json = (await moreRes.json()) as ArticlesResponse | ArticleListItem[];

    // Soporta tanto array "pelado" como { items, meta }
    const list: ArticleListItem[] = Array.isArray(json)
      ? json
      : Array.isArray(json.items)
      ? json.items!
      : [];

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
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0f172a, #020617 55%, #020617 100%)",
        padding: "40px 24px 72px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Volver */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: "#cbd5f5",
              textDecoration: "none",
            }}
          >
            ← Volver a la portada
          </Link>
        </div>

        {/* Cinta superior tipo etiqueta */}
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={metaPill}>
              {categoryLabel}
              {showIdeology && (
                <>
                  {" · "}
                  {article.ideology?.toUpperCase()}
                </>
              )}
            </span>
          </div>

          {publishedAtLabel && (
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {publishedAtLabel}
            </div>
          )}
        </div>

        {/* Grid principal */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 3fr) minmax(0, 1.6fr)",
            gap: 24,
          }}
        >
          {/* Columna principal */}
          <article style={mainCard}>
            <header style={{ marginBottom: 20 }}>
              <h1
                style={{
                  fontSize: 32,
                  lineHeight: 1.15,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {article.title}
              </h1>

              {article.summary && (
                <p
                  style={{
                    fontSize: 15,
                    color: "#cbd5f5",
                    maxWidth: 640,
                  }}
                >
                  {article.summary}
                </p>
              )}
            </header>

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "#e5e7eb",
              }}
              dangerouslySetInnerHTML={{
                __html: article.bodyHtml ?? "",
              }}
            />

            <footer
              style={{
                marginTop: 28,
                paddingTop: 16,
                borderTop: "1px solid rgba(148,163,184,0.4)",
                fontSize: 12,
                color: "#9ca3af",
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <span>
                {publishedAtLabel && (
                  <>
                    Publicado: {publishedAtLabel}
                    {" · "}
                  </>
                )}
                Slug: <span style={{ fontStyle: "italic" }}>{article.slug}</span>
              </span>
            </footer>
          </article>

          {/* Columna lateral */}
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Más sobre la categoría */}
            <div style={asideCard}>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  marginBottom: 10,
                  color: "#e5e7eb",
                }}
              >
                Más sobre{" "}
                {article.category?.toLowerCase() ?? "esta categoría"}
              </h2>

              {moreArticles.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af" }}>
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
                          fontSize: 13,
                          color: "#bfdbfe",
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
            <div style={asideCard}>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  marginBottom: 10,
                  color: "#e5e7eb",
                }}
              >
                Titulares rápidos
              </h2>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 8,
                }}
              >
                {moreArticles.map((a, idx) => (
                  <li key={a.id} style={{ fontSize: 13 }}>
                    <span
                      style={{
                        display: "inline-block",
                        minWidth: 18,
                        marginRight: 4,
                        color: "#6b7280",
                      }}
                    >
                      {idx + 1}.
                    </span>
                    <Link
                      href={`/article/${a.slug}`}
                      style={{
                        color: "#e5e7eb",
                        textDecoration: "none",
                      }}
                    >
                      {a.title}
                    </Link>
                    {a.publishedAt && (
                      <div
                        style={{
                          color: "#9ca3af",
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        {formatDate(a.publishedAt)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
