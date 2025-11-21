"use client";

import EconomyHeadlineStrip from "../components/EconomyHeadlineStrip";
import MarketStrip from "../components/ui/MarketStrip";

import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "../types/market";

type Props = {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null;
  bcra: BcraSummary | null;
  budget: BudgetSummary | null;
  countryRisk: number | null;
  loading: boolean;
};

export default function EconomiaSection({
  dolar,
  crypto,
  bcra,
  budget,
  countryRisk,
  loading,
}: Props) {
  return (
    <section className="mx-auto mb-12 mt-4 max-w-6xl space-y-4">
      {/* Tira rápida arriba: dólar + cripto resumido */}
      <EconomyHeadlineStrip
        dolar={dolar}
        crypto={crypto}
        loading={loading}
      />

      {/* Bloque completo de panorama económico */}
      <MarketStrip
        dolar={dolar}
        crypto={crypto}
        bcra={bcra}
        budget={budget}
        countryRisk={countryRisk}
        loading={loading}
      />
    </section>
  );
}
