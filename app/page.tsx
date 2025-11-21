import ArticleListClient from "./components/ArticleListClient";
import { buildApiUrl } from "./lib/api";
import EconomiaSection from "./sections/EconomiaSection";

import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "./types/market";

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

type CountryRiskResponse = {
  latest?: { date?: string; value?: number } | null;
  [key: string]: any;
};

type MarketData = {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null;
  bcra: BcraSummary | null;
  budget: BudgetSummary | null;
  countryRisk: number | null;
};

// =======================
// Fetch de artículos
// =======================
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

// =======================
// Fetch de datos mercado
// =======================
async function fetchMarketData(): Promise<MarketData> {
  try {
    const [dolarRes, cryptoRes, bcraRes, riskRes, budgetRes] =
      await Promise.all([
        fetch(buildApiUrl("/market/dolar"), { cache: "no-store" }),
        fetch(buildApiUrl("/market/crypto"), { cache: "no-store" }),
        fetch(buildApiUrl("/market/bcra"), { cache: "no-store" }),
        fetch(buildApiUrl("/market/country-risk"), { cache: "no-store" }),
        fetch(buildApiUrl("/economy/budget"), { cache: "no-store" }),
      ]);

    const dolar = dolarRes.ok
      ? ((await dolarRes.json()) as DolarResponse)
      : null;

    const crypto = cryptoRes.ok
      ? ((await cryptoRes.json()) as CryptoResponse)
      : null;

    const bcra = bcraRes.ok
      ? ((await bcraRes.json()) as BcraSummary)
      : null;

    let countryRisk: number | null = null;
    if (riskRes.ok) {
      const json = (await riskRes.json()) as CountryRiskResponse;
      const v = json.latest?.value;
      countryRisk = typeof v === "number" ? v : null;
    }

    const budget = budgetRes.ok
      ? ((await budgetRes.json()) as BudgetSummary)
      : null;

    return { dolar, crypto, bcra, budget, countryRisk };
  } catch (e) {
    console.error("Error fetchMarketData:", e);
    return {
      dolar: null,
      crypto: null,
      bcra: null,
      budget: null,
      countryRisk: null,
    };
  }
}

// =======================
// Página
// =======================
export default async function HomePage() {
  const [{ items, meta }, market] = await Promise.all([
    fetchPublicArticles(),
    fetchMarketData(),
  ]);

  const loading =
    !market.dolar &&
    !market.crypto &&
    !market.bcra &&
    !market.budget &&
    market.countryRisk == null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Noticias / portada */}
      <ArticleListClient initialArticles={items} initialMeta={meta} />

      {/* Panorama económico (ÚNICA vez, sin duplicados) */}
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
