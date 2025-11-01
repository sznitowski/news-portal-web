// app/article/[slug]/page.tsx
import { getArticleBySlug } from "../../lib/api";
import { formatDate } from "../../lib/formatDate";
import { ArticleFull } from "../../types/article";

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article: ArticleFull | null = await getArticleBySlug(params.slug);

  if (!article) {
    // 404 lógico
    return (
      <main className="max-w-3xl mx-auto p-6 text-neutral-100 bg-neutral-900 min-h-screen">
        <h1 className="text-xl font-semibold text-red-400 mb-4">
          Artículo no encontrado
        </h1>
        <a
          href="/"
          className="text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Volver al inicio
        </a>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 text-neutral-100 bg-neutral-900 min-h-screen">
      {/* header navegación */}
      <nav className="mb-6 text-sm">
        <a
          href="/"
          className="text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Volver
        </a>
      </nav>

      {/* metadata */}
      <header className="mb-6 border-b border-neutral-700 pb-4">
        <div className="text-xs uppercase tracking-wide text-blue-400 font-semibold">
          {article.category?.toUpperCase() || "SIN CATEGORÍA"}
        </div>

        <div className="text-xs text-neutral-400 mt-1 flex flex-wrap gap-2">
          <span>{formatDate(article.publishedAt)}</span>
          <span>({article.ideology})</span>
        </div>

        <h1 className="text-2xl font-bold text-neutral-100 mt-3 leading-snug">
          {article.title}
        </h1>

        {article.summary ? (
          <p className="text-neutral-400 italic mt-2">{article.summary}</p>
        ) : (
          <p className="text-neutral-500 italic mt-2">(sin resumen)</p>
        )}
      </header>

      {/* cuerpo limpio del artículo */}
      <article
        className="prose prose-invert prose-sm max-w-none"
        // OJO: esto renderiza HTML que vos guardaste en DB
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />

      {/* footer */}
      <footer className="text-center text-neutral-500 text-[11px] mt-12 border-t border-neutral-700 pt-4">
        <div>{`v0.1 - interno / demo`}</div>
      </footer>
    </main>
  );
}
