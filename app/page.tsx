// app/page.tsx
import ArticleListClient from "./components/ArticleListClient";
import MarketStrip from "./sections/economy/MarketStrip";
import EconomyDataSection from "./sections/economy/EconomyDataSection";
import EconomyViewTabs from "./sections/economy/EconomyViewTabs";
import EconomyPanelSection from "./sections/economy/EconomyPanelSection";

import { buildApiUrl } from "./lib/api";
import { fetchEconomyDaily } from "./lib/economy";

import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "./types/market";
import type { EconomyDailySnapshot } from "./types/economy";

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
// Helpers
// ========================

function normalizeParam(
  value: string | string[] | undefined | null,
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// Artículos públicos (opcionalmente filtrados por categoría)
async function fetchPublicArticles(
  category: string | null,
): Promise<PublicArticlesResponse> {
  const params = new URLSearchParams();
  params.set("limit", "40");
  params.set("page", "1");
  if (category) {
    params.set("category", category);
  }

  const url = buildApiUrl(`/articles?${params.toString()}`);

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

// 👉 Acá dejamos de llamar a /market/country-risk.
// El riesgo país queda siempre en null por ahora.
async function fetchMarketAll(): Promise<MarketAll> {
  const [dolar, crypto, bcra, budget] = await Promise.all([
    safeJson<DolarResponse>("/market/dolar"),
    safeJson<CryptoResponse>("/market/crypto"),
    safeJson<BcraSummary>("/market/bcra"),
    safeJson<BudgetSummary>("/economy/budget"),
  ]);

  return {
    dolar,
    crypto,
    bcra,
    budget,
    countryRisk: null, // sin riesgo país por ahora
  };
}

// ========================
// Página
// ========================

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolved =
    (searchParams ? await searchParams : {}) as Record<
      string,
      string | string[] | undefined
    >;

  const rawCategory = resolved.category;
  const rawView = resolved.view;

  const category = normalizeParam(rawCategory);
  const view = normalizeParam(rawView);

  const normalizedCategory = category ? category.toLowerCase() : null;

  // Contexto "economía": home sin categoría o categoría = economia
  const isEconomyContext =
    !normalizedCategory || normalizedCategory === "economia";

  // Sub-vistas dentro de economía
  const isEconomyDolarCripto =
    normalizedCategory === "economia" && view === "dolar-cripto";

  const isEconomyResumen =
    isEconomyContext && (!view || view === "resumen");

  // ========================
  // Fetch de datos según vista
  // ========================

  let market: MarketAll;
  let items: PublicArticle[] = [];
  let meta: PublicArticlesMeta = {
    page: 1,
    limit: 40,
    total: 0,
    totalPages: 1,
  };
  let snapshots: EconomyDailySnapshot[] = [];

  if (isEconomyDolarCripto) {
    // Sólo necesitamos mercado + snapshots, SIN noticias
    const [marketRes, snapshotsRes] = await Promise.all([
      fetchMarketAll(),
      fetchEconomyDaily({ limit: 30 }),
    ]);
    market = marketRes;
    snapshots = snapshotsRes ?? [];
  } else {
    // Resto de vistas: mercado + noticias
    const [articlesRes, marketRes] = await Promise.all([
      fetchPublicArticles(category),
      fetchMarketAll(),
    ]);
    items = articlesRes.items;
    meta = articlesRes.meta;
    market = marketRes;
  }

  const loading =
    !market.dolar &&
    !market.crypto &&
    !market.bcra &&
    !market.budget &&
    market.countryRisk == null;

  return (
    <>
      {/* Submenú pegado al menú principal (solo se muestra en Economía) */}
      <EconomyViewTabs />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* 1) ARRIBA: tira con precio del dólar 
            - Home (sin categoría) y Economía muestran la tira
            - Otras categorías (política, internacional, etc.) no */}
        {isEconomyContext && (
          <div className="mt-2">
            <MarketStrip
              dolar={market.dolar}
              crypto={market.crypto}
              bcra={market.bcra}
              budget={market.budget}
              countryRisk={market.countryRisk}
              loading={loading}
              showHeader={false}
              showDolar={true}
              showCrypto={false}
              showBcra={false}
              showBudget={false}
            />
          </div>
        )}

        {/* 2-A) Vista Economía → Dólar y Criptomonedas:
                sólo panel de dólar (sin noticias) */}
        {isEconomyDolarCripto && (
          <EconomyPanelSection snapshots={snapshots} 
          crypto={market.crypto}  />
          
        )}

        {/* 2-B) Resto de vistas: listado de artículos */}
        {!isEconomyDolarCripto && (
          <ArticleListClient
            initialArticles={items}
            initialMeta={meta}
            dolar={market.dolar}
            crypto={market.crypto}
            loading={loading}
          />
        )}

        {/* 3) Panel de datos “macro” sólo en Resumen de Economía
              (home / economía sin view o view=resumen) */}
        {isEconomyResumen && (
          <EconomyDataSection
            dolar={market.dolar}
            crypto={market.crypto}
            bcra={market.bcra}
            budget={market.budget}
            countryRisk={market.countryRisk}
            loading={loading}
          />
        )}
      </main>
    </>
  );
}
