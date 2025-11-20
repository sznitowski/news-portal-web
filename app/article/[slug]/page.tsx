// app/article/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";

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
  // Next 16: params es un Promise
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // --- detalle del artículo ---
  const detailUrl = buildApiUrl(`/articles/${encodeURIComponent(slug)}`);
  const detailRes = await fetch(detailUrl, { cache: "no-store" });

  if (detailRes.status === 404) notFound();
  if (!detailRes.ok) throw new Error("Error al cargar el artículo");

  const article: ArticleDetail = await detailRes.json();

  // --- más artículos de la misma categoría ---
  const moreUrl = buildApiUrl(
    `/articles?limit=8&page=1&category=${encodeURIComponent(
      article.category ?? "",
    )}`,
  );
  const moreRes = await fetch(moreUrl, { cache: "no-store" });

  let moreArticles: ArticleListItem[] = [];
  if (moreRes.ok) {
    const json = (await moreRes.json()) as ArticlesResponse | ArticleListItem[];

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
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-5xl lg:max-w-6xl">
        {/* Volver */}
        <div className="mb-4">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ← Volver a la portada
          </Link>
        </div>

        {/* Cinta superior */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-50 shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
              {categoryLabel}
              {showIdeology && (
                <span className="ml-1 text-[10px] text-sky-200">
                  · {article.ideology?.toUpperCase()}
                </span>
              )}
            </span>
          </div>

          {publishedAtLabel && (
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
              {publishedAtLabel}
            </div>
          )}
        </div>

        {/* Grid principal */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.5fr)] lg:items-start">
          {/* Columna principal */}
          <article className="rounded-[28px] bg-white px-5 py-6 shadow-[0_22px_55px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 md:px-7 md:py-7">
            <header className="mb-4 md:mb-5">
              <h1 className="text-2xl font-semibold leading-snug text-slate-900 md:text-3xl">
                {article.title}
              </h1>

              {article.summary && (
                <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-[15px]">
                  {article.summary}
                </p>
              )}
            </header>

            {/* Cuerpo de la nota */}
            <div
              className="article-body text-[15px] leading-relaxed text-slate-800"
              dangerouslySetInnerHTML={{
                __html: article.bodyHtml ?? "",
              }}
            />

            <footer className="mt-6 border-t border-slate-200 pt-3 text-xs text-slate-500 md:mt-7 md:pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  {publishedAtLabel && (
                    <>
                      Publicado: {publishedAtLabel}
                      {" · "}
                    </>
                  )}
                  Slug:{" "}
                  <span className="italic text-slate-600">
                    {article.slug}
                  </span>
                </span>
              </div>
            </footer>
          </article>

          {/* Columna lateral */}
          <section className="flex flex-col gap-4">
            {/* Más sobre la categoría */}
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
              <h2 className="text-sm font-semibold text-slate-900">
                Más sobre{" "}
                {article.category
                  ? article.category.toLowerCase()
                  : "esta categoría"}
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Otras notas recientes en la misma temática.
              </p>

              {moreArticles.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">
                  No hay más artículos en esta categoría.
                </p>
              ) : (
                <ul className="mt-3 grid gap-2 text-xs">
                  {moreArticles.slice(0, 5).map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/article/${a.slug}`}
                        className="text-slate-900 hover:text-sky-700"
                      >
                        {a.title}
                      </Link>
                      {a.publishedAt && (
                        <div className="text-[10px] text-slate-500">
                          {formatDate(a.publishedAt)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Titulares rápidos */}
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.20)]">
              <h2 className="text-sm font-semibold text-slate-900">
                Titulares rápidos
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Vistazo relámpago a las últimas notas de esta sección.
              </p>

              <ul className="mt-4 space-y-3">
                {moreArticles.slice(0, 8).map((a, idx) => (
                  <li
                    key={a.id}
                    className="relative border-l border-slate-200 pl-4"
                  >
                    <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-sky-500" />
                    <Link
                      href={`/article/${a.slug}`}
                      className="block text-xs font-semibold leading-snug text-slate-900 hover:text-sky-700"
                    >
                      {idx + 1}. {a.title}
                    </Link>
                    {a.publishedAt && (
                      <div className="mt-0.5 text-[10px] text-slate-500">
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
