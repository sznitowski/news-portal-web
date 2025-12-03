// app/lib/market.ts
import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
  MarketSummary,
} from "../types/market";
import type { IndecSummary } from "../types/economy";
import { fetchIndecSummary } from "./economy";

/**
 * Misma normalización que en lib/api.ts:
 * - default a http://127.0.0.1:5001
 * - si el host es "localhost", lo cambiamos por "127.0.0.1"
 */
function normalizeApiBase(raw: string | undefined): string {
  let value = (raw ?? "").trim();

  if (!value) {
    value = "http://127.0.0.1:5001";
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }

  try {
    const u = new URL(value);
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
    }
    return u.toString().replace(/\/+$/, "");
  } catch {
    return value.replace("localhost", "127.0.0.1").replace(/\/+$/, "");
  }
}

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5001";
const API_BASE = normalizeApiBase(RAW_API_BASE);

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.error(`Error GET ${path}`, e);
    return null;
  }
}

// Para cosas simples donde sólo querés dólar + cripto (shape resumido)
export async function fetchMarketSummary(): Promise<MarketSummary | null> {
  return safeGet<MarketSummary>("/market/summary");
}

// ---- Shape completo para las páginas de Economía ----
export type MarketAll = {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null;
  bcra: BcraSummary | null;
  budget: BudgetSummary | null;
  indec: IndecSummary | null;
  countryRisk: number | null;
};

export async function fetchMarketAll(): Promise<MarketAll> {
  try {
    const [dolar, crypto, bcra, budget, indec, countryRiskRaw] =
      await Promise.all([
        safeGet<DolarResponse>("/market/dolar"),
        safeGet<CryptoResponse>("/market/crypto"),
        safeGet<BcraSummary>("/market/bcra"),
        safeGet<BudgetSummary>("/economy/budget"),
        fetchIndecSummary(), // INDEC (IPC mensual / interanual / acumulado)
        safeGet<any>("/market/country-risk"),
      ]);

    let countryRisk: number | null = null;
    if (typeof countryRiskRaw === "number") {
      countryRisk = countryRiskRaw;
    } else if (
      countryRiskRaw &&
      typeof countryRiskRaw === "object" &&
      typeof (countryRiskRaw as any).value === "number"
    ) {
      countryRisk = (countryRiskRaw as any).value;
    }

    return {
      dolar: dolar ?? null,
      crypto: crypto ?? null,
      bcra: bcra ?? null,
      budget: budget ?? null,
      indec: indec ?? null,
      countryRisk,
    };
  } catch (e) {
    console.error("Error cargando mercado completo", e);
    return {
      dolar: null,
      crypto: null,
      bcra: null,
      budget: null,
      indec: null,
      countryRisk: null,
    };
  }
}
