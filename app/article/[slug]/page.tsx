// app/article/[slug]/page.tsx
import { getArticleBySlug, formatDate } from "../../lib/api";
import { ArticleFull } from "../../types/article";

// Esta página se genera en el server en cada request (no cache en dev)
export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  // traemos la nota completa
  const article: ArticleFull = await getArticleBySlug(params.slug);

  return (
    <main className="mx-auto max-w-3xl p-6 text-neutral-100 bg-neutral-950 min-h-screen">
      {/* cabecera / volver */}
      <nav className="mb-6 text-sm">
        <a
          href="/"
          className="text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Volver
        </a>
      </nav>

      {/* categoría / fecha / ideología */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mb-2">
        <span className="uppercase tracking-wide text-amber-400">
          {article.category || "sin categoría"}
        </span>
        <span>•</span>
        <span>{formatDate(article.publishedAt)}</span>
        <span>•</span>
        <span className="text-red-400 font-semibold">
          {article.ideology || "NEUTRAL"}
        </span>
      </div>

      {/* título */}
      <h1 className="text-2xl font-bold text-white leading-tight mb-4">
        {article.title}
      </h1>

      {/* cuerpo HTML limpio que guardamos en bodyHtml */}
      <article
        className="prose prose-invert prose-neutral max-w-none prose-headings:text-white prose-p:text-neutral-200 prose-strong:text-white prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml || "" }}
      />

      {/* metadata final */}
      <div className="mt-10 border-t border-neutral-800 pt-4 text-xs text-neutral-600">
        <div>
          Publicado:{" "}
          <span className="text-neutral-400">
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <div>
          Última actualización:{" "}
          <span className="text-neutral-400">
            {formatDate(article.updatedAt)}
          </span>
        </div>
        <div className="mt-2 italic text-neutral-500">
          Fuente procesada internamente. Texto saneado.
        </div>
      </div>
    </main>
  );
}
