// app/sections/economy/EconomiaSection.tsx
import MarketStrip from "./MarketStrip";
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
  showHeader?: boolean;
  showDolar?: boolean;
};

export default function EconomiaSection({
  dolar,
  crypto,
  bcra,
  budget,
  countryRisk,
  loading,
  showHeader = false,
  showDolar = false,
}: Props) {
  const hasSomething =
    dolar || crypto || bcra || budget || countryRisk != null;

  if (!hasSomething && !loading) {
    return null;
  }

  return (
    <section className="mx-auto mt-12 max-w-6xl px-4 pb-10">
      <MarketStrip
        dolar={dolar}
        crypto={crypto}
        bcra={bcra}
        budget={budget}
        countryRisk={countryRisk}
        loading={loading}
        showHeader={showHeader}
        showDolar={showDolar}
      />
    </section>
  );
}
