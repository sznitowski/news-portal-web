// app/sections/EconomiaSection.tsx
"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "../lib/api";
import MarketStrip from "../components/ui/MarketStrip";
import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "../types/market";

type CountryRiskResponse = {
  latest?: { date?: string; value?: number } | null;
  [key: string]: any;
};

export default function EconomiaSection() {
  const [dolarData, setDolarData] = useState<DolarResponse | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoResponse | null>(null);
  const [bcraData, setBcraData] = useState<BcraSummary | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetSummary | null>(null);
  const [countryRisk, setCountryRisk] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);

      // Dólar
      fetch(buildApiUrl("/market/dolar"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => !cancelled && json && setDolarData(json))
        .catch(() => {});

      // Cripto
      fetch(buildApiUrl("/market/crypto"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => !cancelled && json && setCryptoData(json))
        .catch(() => {})
        .finally(() => !cancelled && setLoading(false));

      // BCRA
      fetch(buildApiUrl("/market/bcra"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => !cancelled && json && setBcraData(json))
        .catch(() => {});

      // Riesgo país
      fetch(buildApiUrl("/market/country-risk"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json: CountryRiskResponse | null) => {
          if (cancelled || !json) return;
          const v = json.latest?.value;
          setCountryRisk(typeof v === "number" ? v : null);
        })
        .catch(() => {});

      // Presupuesto nacional
      fetch(buildApiUrl("/economy/budget"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json: BudgetSummary | null) => {
          if (!cancelled && json) setBudgetData(json);
        })
        .catch(() => {});
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section style={{ marginBottom: 24, maxWidth: 1200, marginInline: "auto" }}>
      <MarketStrip
        dolar={dolarData}
        crypto={cryptoData}
        bcra={bcraData}
        countryRisk={countryRisk}
        budget={budgetData}
        loading={loading}
      />
    </section>
  );
}
