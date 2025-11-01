// app/article/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleBySlug } from "../../lib/api";
import { formatDate } from "../../lib/formatDate";
import { ArticleFull } from "../../types/article";

// Esta página se genera en el server en cada request (no cache en dev)
export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  // buscamos la nota completa
  const article: ArticleFull | null = await getArticleBySlug(params.slug);

  // si no existe devolvemos 404 de Next
  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-6 text-neutral-100 bg-neutral-950 min-h-screen">
      {/* cabecera / volver */}
      <nav className="mb-6 text-sm">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Volver
        </Link>
      </nav>

      {/* metadata arriba */}
      <header className="mb-4">
        <div className="text-xs text-neutral-400 flex flex-wrap gap-2 mb-2">
          <span className="uppercase font-semibold text-[10px] tracking-wide text-blue-300">
            {article.category || "sin categoría"}
          </span>

          <span className="text-neutral-500">
            {article.publishedAt
              ? formatDate(article.publishedAt)
              : "sin fecha"}
          </span>

          {article.ideology ? (
            <span className="text-neutral-500">
              ({article.ideology})
            </span>
          ) : null}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 leading-snug">
          {article.title}
        </h1>

        {article.summary ? (
          <p className="text-base text-neutral-300 leading-relaxed">
            {article.summary}
          </p>
        ) : null}
      </header>

      <hr className="border-neutral-700 mb-6" />

      {/* cuerpo limpio renderizado como HTML */}
      <article
        className="prose prose-invert prose-sm max-w-none
                   prose-headings:text-neutral-100
                   prose-p:text-neutral-200
                   prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                   prose-strong:text-neutral-100
                   prose-li:marker:text-neutral-500"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />

      <hr className="border-neutral-700 mt-10 mb-4" />

      <footer className="text-[11px] text-neutral-500 flex flex-col gap-1">
        <div>
          Publicado:{" "}
          {article.publishedAt
            ? formatDate(article.publishedAt)
            : "sin fecha"}
        </div>
        <div>Última actualización: {formatDate(article.updatedAt)}</div>
        <div className="text-neutral-600">
          id interno #{article.id} • slug “{article.slug}”
        </div>
      </footer>
    </main>
  );
}
