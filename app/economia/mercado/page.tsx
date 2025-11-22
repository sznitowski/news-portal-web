// app/economia/mercado/page.tsx
import { fetchMarketAll } from "../../lib/market";
import {
  EconomyHeadlineStrip,
  MarketStrip,
} from "../../sections/economy";

export default async function EconomiaMercadoPage() {
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

      {/* Panel centrado sólo en mercado cambiario + cripto */}
      <MarketStrip
        dolar={market.dolar}
        crypto={market.crypto}
        bcra={market.bcra}
        budget={market.budget}
        countryRisk={market.countryRisk}
        loading={loading}
        showHeader={true}
        showDolar={true}
        showCrypto={true}
        showBcra={false}
        showBudget={false}
      />
    </main>
  );
}
