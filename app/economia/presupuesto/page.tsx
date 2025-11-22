// app/economia/presupuesto/page.tsx
import { fetchMarketAll } from "../../lib/market";
import { EconomyHeadlineStrip, MarketStrip } from "../../sections/economy";

export default async function EconomiaPresupuestoPage() {
  const market = await fetchMarketAll();

  const loading =
    !market.dolar &&
    !market.crypto &&
    !market.bcra &&
    !market.budget &&
    market.countryRisk == null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Tira de datos arriba */}
      <EconomyHeadlineStrip
        dolar={market.dolar}
        crypto={market.crypto}
        bcra={market.bcra}
        budget={market.budget}
        countryRisk={market.countryRisk}
        loading={loading}
      />

      {/* Panel sólo con presupuesto / resultado primario */}
      <MarketStrip
        dolar={market.dolar}
        crypto={market.crypto}
        bcra={market.bcra}
        budget={market.budget}
        indec={market.indec}
        countryRisk={market.countryRisk}
        loading={loading}
        showHeader={true}
        showDolar={false}
        showCrypto={false}
        showBcra={false}
        showBudget={true}
      />
    </main>
  );
}
