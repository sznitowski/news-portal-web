// app/page.tsx
import ArticleListClient from "./components/ArticleListClient";
import { EconomiaSection } from "./sections/economy";
import { buildApiUrl } from "./lib/api";
import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "./types/market";

// ========================
// Tipos de artículos
// ========================

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

// ========================
// Fetch de artículos públicos
// ========================

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

// ========================
// Datos de mercado
// ========================

type CountryRiskResponse = {
  latest?: { value?: number } | null;
  [key: string]: any;
};

type MarketAll = {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null;
  bcra: BcraSummary | null;
  budget: BudgetSummary | null;
  countryRisk: number | null;
};

async function safeJson<T>(path: string): Promise<T | null> {
  const url = buildApiUrl(path);
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error("Error al pedir", path, err);
    return null;
  }
}

async function fetchMarketAll(): Promise<MarketAll> {
  const [dolar, crypto, bcra, countryRiskRaw, budget] = await Promise.all([
    safeJson<DolarResponse>("/market/dolar"),
    safeJson<CryptoResponse>("/market/crypto"),
    safeJson<BcraSummary>("/market/bcra"),
    safeJson<CountryRiskResponse>("/market/country-risk"),
    safeJson<BudgetSummary>("/economy/budget"),
  ]);

  const countryRiskValue =
    typeof countryRiskRaw?.latest?.value === "number"
      ? countryRiskRaw.latest.value
      : null;

  return {
    dolar,
    crypto,
    bcra,
    budget,
    countryRisk: countryRiskValue,
  };
}

// ========================
// Página
// ========================

export default async function HomePage() {
  const [{ items, meta }, market] = await Promise.all([
    fetchPublicArticles(),
    fetchMarketAll(),
  ]);

  const loading =
    !market.dolar &&
    !market.crypto &&
    !market.bcra &&
    !market.budget &&
    market.countryRisk == null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Listado principal de notas + tira de dólar en Economía */}
      <ArticleListClient
        initialArticles={items}
        initialMeta={meta}
        dolar={market.dolar}
        crypto={market.crypto}
        loading={loading}
      />

      {/* Panel grande de Economía: BCRA + Presupuesto + etc. */}
      <EconomiaSection
        dolar={market.dolar}
        crypto={market.crypto}
        bcra={market.bcra}
        budget={market.budget}
        countryRisk={market.countryRisk}
        loading={loading}
      />
    </main>
  );
}
