// app/lib/market.ts
import { buildApiUrl } from "./api";
import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "../types/market";

type CountryRiskResponse = {
  latest?: { value?: number } | null;
  [key: string]: unknown;
};

export type MarketAll = {
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

export async function fetchMarketAll(): Promise<MarketAll> {
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
