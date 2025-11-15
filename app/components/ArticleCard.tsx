// app/ArticleCard.tsx
import Link from "next/link";

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

type Props = {
  article: ArticleSummary;
};

export default function ArticleCard({ article }: Props) {
  return (
    <li
      style={{
        borderRadius: 16,
        padding: 24,
        backgroundColor: "#fff",
        color: "#111827",
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 15px rgba(15,23,42,0.03)",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
      }}
    >
      {/* Meta (categoría, fecha, ideología) */}
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>{article.category.toUpperCase()}</span>
        <span>·</span>
        <span>
          {new Date(article.publishedAt).toLocaleString("es-AR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
        <span>·</span>
        <span>({article.ideology})</span>
      </div>

      {/* Título linkeable */}
      <Link
        href={`/article/${article.slug}`}
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#111827",
          textDecoration: "none",
        }}
      >
        {article.title}
      </Link>

      {/* Resumen */}
      {article.summary ? (
        <p
          style={{
            color: "#4b5563",
            fontSize: 14,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          {article.summary}
        </p>
      ) : (
        <p
          style={{
            color: "#9ca3af",
            fontSize: 14,
            marginTop: 8,
            fontStyle: "italic",
          }}
        >
          (sin resumen)
        </p>
      )}
    </li>
  );
}
