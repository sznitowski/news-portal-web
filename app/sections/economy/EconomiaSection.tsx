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
import type { IndecSummary } from "../../types/economy";

type Props = {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null;
  bcra: BcraSummary | null;
  budget: BudgetSummary | null;
  indec: IndecSummary | null;
  countryRisk: number | null;
  loading: boolean;
};

export default function EconomiaSection({
  dolar,
  crypto,
  bcra,
  budget,
  indec,
  countryRisk,
  loading,
}: Props) {
  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 pb-12">
      {/* 1) ARRIBA: sólo precios del dólar / mercado cambiario */}
      <MarketStrip
        dolar={dolar}
        crypto={crypto}
        bcra={bcra}
        budget={budget}
        indec={indec}
        countryRisk={countryRisk}
        loading={loading}
        // Configuración: sin título grande y sólo dólar/cripto
        showHeader={false}
        showDolar={true}
        showCrypto={true}
        showBcra={false}
        showBudget={false}
      />

      {/* 2) EN EL MEDIO: notas de economía */}
      <NewsListSection category="economia" />

      {/* 3) ABAJO: panel “Lectura rápida de los datos”
          (BCRA + presupuesto + inflación INDEC) */}
      <EconomyDataSection
        dolar={dolar}
        crypto={crypto}
        bcra={bcra}
        budget={budget}
        indec={indec}
        countryRisk={countryRisk}
        loading={loading}
      />
    </section>
  );
}
