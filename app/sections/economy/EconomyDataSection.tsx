// app/sections/economy/EconomyDataSection.tsx
"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "../../lib/api";
import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "../../types/market";

import EconomyHeadlineStrip from "./EconomyHeadlineStrip";
import EconomiaSection from "./EconomiaSection";

export default function EconomyDataSection() {
  const [dolar, setDolar] = useState<DolarResponse | null>(null);
  const [crypto, setCrypto] = useState<CryptoResponse | null>(null);
  const [bcra, setBcra] = useState<BcraSummary | null>(null);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [countryRisk, setCountryRisk] = useState<number | null>(null); // por ahora null
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [dRes, cRes, bRes, budRes] = await Promise.all([
          fetch(buildApiUrl("/market/dolar")),
          fetch(buildApiUrl("/market/crypto")),
          fetch(buildApiUrl("/market/bcra")),
          fetch(buildApiUrl("/economy/budget")),
        ]);

        if (cancelled) return;

        setDolar(dRes.ok ? ((await dRes.json()) as DolarResponse) : null);
        setCrypto(cRes.ok ? ((await cRes.json()) as CryptoResponse) : null);
        setBcra(bRes.ok ? ((await bRes.json()) as BcraSummary) : null);
        setBudget(budRes.ok ? ((await budRes.json()) as BudgetSummary) : null);

        // Cuando tengas endpoint de riesgo país, lo seteás acá
        setCountryRisk(null);
      } catch (err) {
        console.error("Error cargando datos de economía", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Tira de tarjetas de dólar arriba de todo */}
      <section className="mx-auto mt-12 max-w-6xl px-4 pb-4">
        <EconomyHeadlineStrip
          dolar={dolar}
          crypto={crypto}
          loading={loading}
        />
      </section>

      {/* Bloque grande de mercado / BCRA / Presupuesto */}
      <EconomiaSection
        dolar={dolar}
        crypto={crypto}
        bcra={bcra}
        budget={budget}
        countryRisk={countryRisk}
        loading={loading}
      />
    </>
  );
}
