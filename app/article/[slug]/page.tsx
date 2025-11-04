// app/article/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildApiUrl } from "../../lib/api";
import { ArticleFull, ArticleListItem } from "../../types/article";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1) Detalle del artículo
  const articleRes = await fetch(buildApiUrl(`/articles/${slug}`), {
    cache: "no-store",
  });

  if (articleRes.status === 404) {
    notFound();
  }

  if (!articleRes.ok) {
    throw new Error(
      `failed to fetch /articles/:slug (status ${articleRes.status})`
    );
  }

  const article = (await articleRes.json()) as ArticleFull;

  // 2) Titulares para el lateral
  const listParams = new URLSearchParams();
  listParams.set("limit", "5");
  listParams.set("page", "1");

  const listRes = await fetch(buildApiUrl("/articles", listParams), {
    cache: "no-store",
  });

  let latest: ArticleListItem[] = [];
  if (listRes.ok) {
    latest = (await listRes.json()) as ArticleListItem[];
  }

  // 3) Relacionado por categoría (excepto el mismo slug)
  const related = latest.filter(
    (a) => a.category === article.category && a.slug !== article.slug
  );
  const primaryRelated = related[0];

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "48px auto 80px",
        padding: "0 16px",
      }}
    >
      {/* Barra superior oscura con meta */}
      <div
        style={{
          backgroundColor: "#050505",
          color: "#f9fafb",
          borderRadius: 4,
          padding: "10px 16px",
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          fontSize: 13,
        }}
      >
        <Link
          href="/"
          style={{
            color: "#e5e7eb",
            textDecoration: "none",
          }}
        >
          ← Volver a la portada
        </Link>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <span>{article.category}</span>
          <span>·</span>
          <span>({article.ideology || "RIGHT"})</span>
          <span>·</span>
          <span>
            {new Date(article.publishedAt).toLocaleString("es-AR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </span>
        </div>
      </div>

      {/* Grid principal: nota + lateral */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 32,
        }}
      >
        {/* === CUERPO DE LA NOTA (CARD) === */}
        <article
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: 16,
            padding: "32px 40px",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            alignSelf: "flex-start",
          }}
        >
          <h1
            style={{
              fontSize: 32,
              lineHeight: 1.1,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {article.title}
          </h1>

          {article.summary && (
            <p
              style={{
                fontSize: 18,
                color: "#4b5563",
                marginBottom: 24,
              }}
            >
              {article.summary}
            </p>
          )}

          <div
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: "#111827",
              marginBottom: 32,
            }}
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />

          <p
            style={{
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Publicado:{" "}
            {new Date(article.publishedAt).toLocaleString("es-AR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
            {" · "}
            <span style={{ fontStyle: "italic" }}>Slug: {article.slug}</span>
          </p>
        </article>

        {/* === LATERAL (CARDS) === */}
        <aside
          style={{
            display: "grid",
            gap: 16,
            alignSelf: "flex-start",
          }}
        >
          {/* Más sobre {categoría} */}
          <section
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: 12,
              padding: "16px 20px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Más sobre {article.category.toLowerCase()}
            </h2>

            {primaryRelated ? (
              <div>
                <Link
                  href={`/article/${primaryRelated.slug}`}
                  style={{
                    display: "block",
                    fontSize: 14,
                    color: "#111827",
                    fontWeight: 500,
                    textDecoration: "none",
                    marginBottom: 4,
                  }}
                >
                  {primaryRelated.title}
                </Link>
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  {new Date(primaryRelated.publishedAt).toLocaleDateString(
                    "es-AR",
                    { dateStyle: "medium" }
                  )}
                </p>
              </div>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                }}
              >
                No hay más artículos en esta categoría.
              </p>
            )}
          </section>

          {/* Titulares rápidos */}
          <section
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: 12,
              padding: "16px 20px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Titulares rápidos
            </h2>

            <ol
              style={{
                paddingLeft: 20,
                margin: 0,
                display: "grid",
                gap: 8,
                fontSize: 14,
              }}
            >
              {latest.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/article/${a.slug}`}
                    style={{
                      textDecoration: "none",
                      color:
                        a.slug === article.slug ? "#111827" : "#1d4ed8",
                      fontWeight: a.slug === article.slug ? 600 : 400,
                    }}
                  >
                    {a.title}
                  </Link>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    {new Date(a.publishedAt).toLocaleDateString("es-AR", {
                      dateStyle: "medium",
                    })}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
