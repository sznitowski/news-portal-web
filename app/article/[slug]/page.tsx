// app/article/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { ArticleFull } from "./../../types/article";
import { buildApiUrl } from "../../lib/api";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 👈 En Next 16 params es una Promise, así que lo desestructuramos con await
  const { slug } = await params;

  const url = buildApiUrl(`/articles/${slug}`);
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error(`Error al cargar artículo (HTTP ${res.status})`);
  }

  const article: ArticleFull = await res.json();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-[11px] text-neutral-500 mb-2 flex flex-wrap gap-1">
        <span className="uppercase tracking-wide">
          {article.category || "sin categoría"}
        </span>
        {article.publishedAt && (
          <>
            <span>·</span>
            <span>{formatDateTime(article.publishedAt)}</span>
          </>
        )}
        {article.ideology && (
          <>
            <span>·</span>
            <span>({article.ideology})</span>
          </>
        )}
      </div>

      <h1 className="text-3xl font-semibold text-slate-900 mb-4">
        {article.title}
      </h1>

      {article.summary && (
        <p className="text-lg text-neutral-700 mb-6">{article.summary}</p>
      )}

      <article
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />
    </main>
  );
}
