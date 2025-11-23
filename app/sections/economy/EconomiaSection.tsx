// app/sections/economy/EconomiaSection.tsx
"use client";

import MarketStrip from "./MarketStrip";
import EconomyDataSection from "./EconomyDataSection";
import NewsListSection from "../NewsListSection";

import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "../../types/market";

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
    <section className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
      {/* 1) ARRIBA: tira con SOLO precios del dólar */}
      <div className="mt-4">
        <MarketStrip
          dolar={dolar}
          crypto={crypto}
          bcra={bcra}
          budget={budget}
          countryRisk={countryRisk}
          loading={loading}
          // sin título grande, sólo tira de cotizaciones
          showHeader={false}
          showDolar={true}
          showCrypto={false}
          showBcra={false}
          showBudget={false}
        />
      </div>

      {/* 2) EN EL MEDIO: noticias de economía */}
      <NewsListSection category="economia" />

      {/* 3) ABAJO: panel “Lectura rápida de los datos”
          (brecha, reservas BCRA, presupuesto, inflación…) */}
      <EconomyDataSection
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
