// app/components/ArticleListClient.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import EconomiaSection from "../sections/EconomiaSection";

type PublicArticle = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  ideology: string | null;
  sourceIdeology: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bodyHtml: string | null;

  // opcionales
  coverImageUrl?: string | null;
  imageUrl?: string | null;

  // si más adelante guardás vistas en la API, usás esto
  viewCount?: number | null;
};

type PublicArticlesMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Props = {
  initialArticles: PublicArticle[]; // 👈 ARRAY
  initialMeta: PublicArticlesMeta;
};

export default function ArticleListClient({
  initialArticles,
  initialMeta: _initialMeta,
}: Props) {
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");

  const normalizedCategory = useMemo(() => {
    if (!categoryParam) return null;

    const cat = categoryParam.toLowerCase();
    const allowed = ["noticias", "politica", "economia", "internacional"];

    if (!allowed.includes(cat)) return null;
    return cat;
  }, [categoryParam]);

  // Orden por fecha desc (lo más nuevo primero)
  const articles = useMemo(
    () =>
      [...initialArticles].sort((a, b) => {
        const da = new Date(a.publishedAt ?? a.createdAt).getTime();
        const db = new Date(b.publishedAt ?? b.createdAt).getTime();
        return db - da;
      }),
    [initialArticles],
  );

  // Filtro por categoría + búsqueda por título
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    let base = articles;
    if (normalizedCategory) {
      base = base.filter(
        (a) => a.category.toLowerCase() === normalizedCategory,
      );
    }

    if (!term) return base;
    return base.filter((a) => a.title.toLowerCase().includes(term));
  }, [articles, search, normalizedCategory]);

  const hero = filtered[0];
  const rest = filtered.slice(1);

  // últimas 6 dentro del filtro actual (home o categoría)
  const latest6 = filtered.slice(0, 6);

  // top 5 más vistas — si todavía no tenés viewCount, queda en placeholder
  const mostViewed5 = useMemo(() => {
    if (!initialArticles || initialArticles.length === 0) return [];

    // si nunca seteaste viewCount, todos serán undefined → queda vacío
    const withViews = initialArticles.filter(
      (a) => typeof a.viewCount === "number",
    );
    if (withViews.length === 0) return [];

    return [...withViews]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 5);
  }, [initialArticles]);

  return (
    <div className="space-y-8">
      {/* BLOQUE DE NOTICIAS (siempre arriba) */}
      <section className="rounded-[32px] bg-slate-50 px-4 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 md:px-8 md:py-8">
        {/* Encabezado + buscador */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-50">
              Últimas noticias
            </div>
            <p className="mt-3 max-w-xl text-xs text-slate-600 md:text-sm">
              Últimas publicaciones del portal, ordenadas por fecha de
              publicación. Las notas deben estar{" "}
              <span className="font-semibold">publicadas</span> en el panel
              editorial para aparecer acá.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título..."
              className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.12)] outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/60"
            />
          </div>
        </header>

        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-slate-500">
            No hay artículos para mostrar. Publicá alguna nota desde el panel
            editorial.
          </p>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
            {/* Columna izquierda: hero + notas comunes */}
            <div className="space-y-6">
              {hero && <HeroArticle article={hero} />}

              {rest.length > 0 && (
                <div className="space-y-4">
                  {rest.slice(0, 8).map((a) => (
                    <CommonArticleRow key={a.id} article={a} />
                  ))}
                </div>
              )}
            </div>

            {/* Columna derecha: últimas 6 + más leídas */}
            <LatestSidebar latest={latest6} mostViewed={mostViewed5} />
          </div>
        )}
      </section>

      {/* PANEL ECONÓMICO: sólo en categoría Economía, debajo de las noticias */}
      {normalizedCategory === "economia" && (
        <section>
          <EconomiaSection />
        </section>
      )}
    </div>
  );
}

// =============================
// Subcomponentes
// =============================

type HeroProps = {
  article: PublicArticle;
};

function HeroArticle({ article }: HeroProps) {
  const when = getDateParts(article.publishedAt ?? article.createdAt);

  const mainImageUrl =
    article.coverImageUrl ||
    article.imageUrl ||
    extractFirstImageFromHtml(article.bodyHtml) ||
    null;

  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-[0_22px_55px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
      <div className="grid gap-0 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)]">
        {/* Imagen principal */}
        <div className="relative min-h-[220px]">
          {mainImageUrl ? (
            <>
              <img
                src={mainImageUrl}
                alt={article.title}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-sky-700" />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-4 text-xs text-slate-100 md:p-5">
            <div className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
              <svg className="h-3 w-3" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9 4.5L7.5 6H5A2 2 0 003 8v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2.5L14 4.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span>Imagen de la nota</span>
            </div>

            {!mainImageUrl && (
              <p className="max-w-xs text-[11px] text-slate-200/85">
                Más adelante se va a mostrar acá la imagen real de la nota.
              </p>
            )}
          </div>
        </div>

        {/* Texto */}
        <div className="flex flex-col gap-3 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-slate-50">
              Destacado
            </span>
            <span>{article.category}</span>
            {article.ideology && (
              <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                {article.ideology}
              </span>
            )}
          </div>

          <Link
            href={`/article/${article.slug}`}
            className="text-xl font-semibold leading-snug text-slate-900 hover:text-sky-700 md:text-2xl"
          >
            {article.title}
          </Link>

          {article.summary && (
            <p className="text-sm text-slate-600">{article.summary}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span>
              {when.date} · {when.time}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            <span>ID {article.id}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

type RowProps = {
  article: PublicArticle;
};

function CommonArticleRow({ article }: RowProps) {
  const when = getDateParts(article.publishedAt ?? article.createdAt);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_12px_35px_rgba(15,23,42,0.14)] transition hover:border-sky-300/80 hover:shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          <span>{article.category}</span>
          {article.ideology && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>{article.ideology}</span>
            </>
          )}
        </div>

        <Link
          href={`/article/${article.slug}`}
          className="mt-1 text-sm font-semibold leading-snug text-slate-900 hover:text-sky-700"
        >
          {article.title}
        </Link>

        {article.summary && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
            {article.summary}
          </p>
        )}

        <div className="mt-1 text-[11px] text-slate-500">
          {when.date} · {when.time}
        </div>
      </div>
    </article>
  );
}

type SidebarProps = {
  latest: PublicArticle[];
  mostViewed: PublicArticle[];
};

function LatestSidebar({ latest, mostViewed }: SidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Últimas 6 */}
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.22)]">
        <h2 className="text-sm font-semibold text-slate-900">
          Últimas 6 noticias
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Listado rápido de las últimas notas publicadas.
        </p>

        <div className="mt-4 space-y-4">
          {latest.map((a) => {
            const when = getDateParts(a.publishedAt ?? a.createdAt);
            return (
              <div
                key={a.id}
                className="relative border-l border-slate-200 pl-4"
              >
                <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-sky-500" />
                <Link
                  href={`/article/${a.slug}`}
                  className="block text-xs font-semibold leading-snug text-slate-900 hover:text-sky-700"
                >
                  {a.title}
                </Link>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  {when.date} · {when.time}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Más leídas */}
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.22)]">
        <h2 className="text-sm font-semibold text-slate-900">Más leídas</h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Top 5 por cantidad de vistas (cuando lo tengamos en la API).
        </p>

        {mostViewed.length === 0 ? (
          <p className="mt-4 text-[11px] text-slate-500 italic">
            Todavía no estamos guardando vistas. Más adelante este bloque va a
            mostrar las notas más leídas del portal.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {mostViewed.map((a, idx) => {
              const when = getDateParts(a.publishedAt ?? a.createdAt);
              return (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-[2px] text-xs font-semibold text-slate-400">
                    {idx + 1}.
                  </span>
                  <div className="flex-1">
                    <Link
                      href={`/article/${a.slug}`}
                      className="block text-xs font-semibold leading-snug text-slate-900 hover:text-sky-700"
                    >
                      {a.title}
                    </Link>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      {when.date} · {a.viewCount ?? 0} vistas
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

// =============================
// Helpers
// =============================

function getDateParts(value: string | null) {
  if (!value) {
    return { date: "-", time: "" };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { date: value, time: "" };
  }

  const date = d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { date, time };
}

// Saca el src de la primera <img ...> que encuentre en el HTML
function extractFirstImageFromHtml(
  html: string | null | undefined,
): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}
