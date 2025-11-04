// app/article/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildApiUrl } from "../../lib/api";

type ArticleFull = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  bodyHtml: string;
  category: string;
  ideology: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

type ArticleListItem = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  ideology: string;
  publishedAt: string;
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1) Nota principal
  const url = buildApiUrl(`/articles/${slug}`);
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error(`failed to fetch /articles/${slug} (status ${res.status})`);
  }

  const article: ArticleFull = await res.json();

  // 2) Notas relacionadas (misma categoría, excluyendo la actual)
  let related: ArticleListItem[] = [];
  try {
    const params = new URLSearchParams();
    params.set("limit", "4");
    params.set("page", "1");
    params.set("category", article.category);

    const relatedUrl = buildApiUrl("/articles", params);
    const relatedRes = await fetch(relatedUrl, { cache: "no-store" });

    if (relatedRes.ok) {
      const all: ArticleListItem[] = await relatedRes.json();
      related = all
        .filter((a) => a.slug !== article.slug)
        .slice(0, 3);
    }
  } catch (e) {
    console.error("Error fetching related articles", e);
  }

  return (
    <main
      style={{
        padding: 16,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Barra superior: volver + metadatos */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 24,
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        <div>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginBottom: 8,
              color: "#60a5fa",
              textDecoration: "none",
            }}
          >
            ← Volver a la portada
          </Link>
          <div
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            {article.category} · ({article.ideology})
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          {new Date(article.publishedAt).toLocaleString("es-AR", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </div>
      </header>

      {/* Título */}
      <h1
        style={{
          fontSize: 32,
          lineHeight: 1.2,
          fontWeight: 600,
          marginBottom: 12,
          color: "#111827",
        }}
      >
        {article.title}
      </h1>

      {/* Copete / resumen */}
      {article.summary && (
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.5,
            color: "#374151",
            marginBottom: 24,
          }}
        >
          {article.summary}
        </p>
      )}

      {/* Cuerpo en HTML */}
      <article
        style={{
          fontSize: 15,
          lineHeight: 1.7,
          color: "#111827",
          borderTop: "1px solid #e5e7eb",
          paddingTop: 24,
        }}
        // el backend ya nos entrega HTML sanitizado
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />

      {/* Footer meta */}
      <footer
        style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid #e5e7eb",
          fontSize: 12,
          color: "#6b7280",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>
          Publicado:{" "}
          {new Date(article.publishedAt).toLocaleString("es-AR", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </span>
        <span style={{ fontStyle: "italic" }}>Slug: {article.slug}</span>
      </footer>

      {/* 3) Notas relacionadas */}
      {related.length > 0 && (
        <section
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 12,
              color: "#111827",
            }}
          >
            Más sobre {article.category}
          </h2>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "grid",
              gap: 12,
            }}
          >
            {related.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/article/${a.slug}`}
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#2563eb",
                    textDecoration: "none",
                  }}
                >
                  {a.title}
                </Link>
                {a.summary && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    {a.summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
