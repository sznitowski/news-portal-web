// app/economia/resumen/page.tsx
import { EconomiaSection, EconomyHeadlineStrip } from "../../sections/economy";
import { buildApiUrl } from "../../lib/api";
import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "../../types/market";

// ===== Tipos auxiliares =====

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

// ===== Helpers de fetch =====

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

export const dynamic = "force-dynamic";

// ===== Página =====

export default async function EconomiaResumenPage() {
  const market = await fetchMarketAll();

  const loading =
    !market.dolar &&
    !market.crypto &&
    !market.bcra &&
    !market.budget &&
    market.countryRisk == null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Tira de dólar arriba */}
      <EconomyHeadlineStrip
        dolar={market.dolar}
        crypto={market.crypto}
        loading={loading}
      />

      {/* Panel grande con BCRA + presupuesto + cripto */}
      <EconomiaSection
        dolar={market.dolar}
        crypto={market.crypto}
        bcra={market.bcra}
        budget={market.budget}
        countryRisk={market.countryRisk}
        loading={loading}
        showHeader={true}
        showDolar={false} // no repetimos el dólar porque ya está arriba
      />
    </main>
  );
}
