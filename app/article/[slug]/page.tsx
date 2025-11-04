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

export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default async function ArticlePage({
  params,
}: {
  // 👇 clave: en Next 16, params es un *Promise* en páginas async
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const url = buildApiUrl(`/articles/${slug}`);
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error(`failed to fetch /articles/${slug} (status ${res.status})`);
  }

  const article: ArticleFull = await res.json();

  return (
    <main style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      {/* breadcrumb / volver */}
      <div
        style={{
          fontSize: 13,
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Link
          href="/"
          style={{
            color: "#2563eb",
            textDecoration: "none",
          }}
        >
          ← Volver a la portada
        </Link>

        <span style={{ color: "#6b7280", fontSize: 12 }}>
          {formatDateTime(article.publishedAt)}
        </span>
      </div>

      {/* meta superior */}
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span>{article.category}</span>
        <span>·</span>
        <span style={{ fontWeight: 600 }}>( {article.ideology} )</span>
      </div>

      {/* título */}
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1.2,
          marginBottom: 16,
        }}
      >
        {article.title}
      </h1>

      {/* resumen */}
      {article.summary && (
        <p
          style={{
            color: "#4b5563",
            fontSize: 16,
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          {article.summary}
        </p>
      )}

      {/* cuerpo HTML */}
      <article
        style={{
          color: "#111827",
          fontSize: 16,
          lineHeight: 1.7,
        }}
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />

      {/* pie de nota */}
      <hr style={{ margin: "32px 0", borderColor: "#e5e7eb" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#9ca3af",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>Publicado: {formatDateTime(article.publishedAt)}</span>
        <span>Slug: {article.slug}</span>
      </div>
    </main>
  );
}
