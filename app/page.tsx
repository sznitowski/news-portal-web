// app/page.tsx
import Link from "next/link";
import { getPublicArticles, formatDate } from "./lib/api";
import { ArticleListItem } from "./types/article";

export default async function HomePage() {
  // Server Component → esto se ejecuta en el server de Next
  const articles: ArticleListItem[] = await getPublicArticles();

  return (
    <main className="mx-auto max-w-4xl p-6 text-neutral-100 bg-neutral-950 min-h-screen">
      {/* Header del sitio */}
      <header className="mb-8 border-b border-neutral-800 pb-4">
        <h1 className="text-2xl font-bold text-white">
          Mi Portal de Noticias
        </h1>
        <p className="text-sm text-neutral-400">
          Últimas publicaciones (scrapeadas → limpiadas → etiquetadas
          "RIGHT")
        </p>
      </header>

      {/* Lista de artículos */}
      <section className="space-y-6">
        {articles.length === 0 && (
          <div className="text-neutral-400 text-sm">
            (Todavía no hay artículos publicados)
          </div>
        )}

        {articles.map((a) => (
          <article
            key={a.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:bg-neutral-800/60 transition"
          >
            {/* categoría / fecha */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mb-2">
              <span className="uppercase tracking-wide text-amber-400">
                {a.category || "sin categoría"}
              </span>
              <span>•</span>
              <span>{formatDate(a.publishedAt)}</span>
              <span>•</span>
              <span className="text-red-400 font-semibold">
                {a.ideology || "NEUTRAL"}
              </span>
            </div>

            {/* título */}
            <h2 className="text-lg font-semibold text-white leading-snug">
              <Link
                href={`/article/${a.slug}`}
                className="hover:underline text-white"
              >
                {a.title}
              </Link>
            </h2>

            {/* resumen */}
            {a.summary ? (
              <p className="mt-2 text-sm text-neutral-300">
                {a.summary}
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-500 italic">
                (sin resumen)
              </p>
            )}

            {/* link "leer más" */}
            <div className="mt-3">
              <Link
                href={`/article/${a.slug}`}
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
              >
                Leer nota completa →
              </Link>
            </div>
          </article>
        ))}
      </section>

      {/* Futuro: paginación, secciones, etc */}
      <footer className="mt-10 border-t border-neutral-800 pt-4 text-center text-xs text-neutral-600">
        <p>v0.1 - interno / demo</p>
      </footer>
    </main>
  );
}
