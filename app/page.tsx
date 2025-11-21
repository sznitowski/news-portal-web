// app/page.tsx
import ArticleListClient from "./components/ArticleListClient";
import { buildApiUrl } from "./lib/api";
import EconomiaSection from "./sections/EconomiaSection";

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

  coverImageUrl?: string | null;
  imageUrl?: string | null;
  viewCount?: number | null;
};

type PublicArticlesMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PublicArticlesResponse = {
  items: PublicArticle[];
  meta: PublicArticlesMeta;
};

async function fetchPublicArticles(): Promise<PublicArticlesResponse> {
  const url = buildApiUrl("/articles?limit=40&page=1");

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Error al cargar artículos públicos:", res.status);
      return {
        items: [],
        meta: { page: 1, limit: 40, total: 0, totalPages: 1 },
      };
    }

    const json = await res.json();

    return {
      items: (json.items ?? []) as PublicArticle[],
      meta: {
        page: json.meta?.page ?? 1,
        limit: json.meta?.limit ?? 40,
        total: json.meta?.total ?? (json.items?.length ?? 0),
        totalPages: json.meta?.totalPages ?? 1,
      },
    };
  } catch (e) {
    console.error("Error fetchPublicArticles:", e);
    return {
      items: [],
      meta: { page: 1, limit: 40, total: 0, totalPages: 1 },
    };
  }
}

export default async function HomePage() {
  const { items, meta } = await fetchPublicArticles();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Noticias / portada */}
      <ArticleListClient initialArticles={items} initialMeta={meta} />

      {/* Panorama económico (se renderiza una sola vez) */}
      <EconomiaSection />
    </main>
  );
}
