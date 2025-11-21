"use client";

type Props = {
  dolar: any | null;
  crypto: any | null;
  loading: boolean;
};

export default function EconomyHeadlineStrip({ dolar, crypto, loading }: Props) {
  const oficial = dolar?.OFICIAL ?? dolar?.oficial ?? null;
  const blue = dolar?.BLUE ?? dolar?.blue ?? null;
  const mep = dolar?.MEP ?? dolar?.mep ?? null;

  const btc = crypto?.BTC ?? crypto?.btc ?? null;
  const eth = crypto?.ETH ?? crypto?.eth ?? null;

  const oficialValue = pickValue(oficial);
  const blueValue = pickValue(blue);
  const mepValue = pickValue(mep);
  const btcValue = pickValue(btc);
  const ethValue = pickValue(eth);

  const btcChange = pickChange(btc);
  const ethChange = pickChange(eth);

  return (
    <div className="rounded-3xl bg-white/90 p-3 shadow-[0_16px_42px_rgba(15,23,42,0.12)] ring-1 ring-slate-200">
      {/* encabezado */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] text-slate-50">
            Panorama rápido
          </span>
          <span className="hidden text-slate-500 sm:inline">
            Dólar y cripto en pesos argentinos.
          </span>
        </div>

        <div className="text-[10px] text-slate-400">
          {loading ? "Cargando cotizaciones..." : "Variación últimas 24 hs."}
        </div>
      </div>

      {/* métricas */}
      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard label="Dólar oficial" value={oficialValue} />
        <MetricCard label="Dólar blue" value={blueValue} />
        <MetricCard label="Dólar MEP" value={mepValue} />
        <MetricCard label="Bitcoin" value={btcValue} change={btcChange} />
        <MetricCard label="Ethereum" value={ethValue} change={ethChange} />
      </div>
    </div>
  );
}

// ========================
// Subcomponentes helpers
// ========================

type MetricCardProps = {
  label: string;
  value: number | null;
  change?: number | null;
};

function MetricCard({ label, value, change }: MetricCardProps) {
  const hasValue = typeof value === "number";
  const formatted = hasValue
    ? value!.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "-";

  const hasChange = typeof change === "number";
  const isUp = hasChange && change! > 0;
  const isDown = hasChange && change! < 0;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>

      <div className="text-sm font-semibold text-slate-900">
        {hasValue ? `$ ${formatted}` : "—"}
      </div>

      <div className="mt-0.5 text-[10px] text-slate-500">
        {hasChange ? (
          <span
            className={
              isUp
                ? "text-emerald-600"
                : isDown
                ? "text-rose-600"
                : "text-slate-500"
            }
          >
            {isUp ? "▲" : isDown ? "▼" : "•"} {change!.toFixed(2)}% últimas 24
            hs
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>
    </div>
  );
}

// intenta adivinar el campo numérico principal del objeto de cotización
function pickValue(quote: any): number | null {
  if (!quote) return null;
  const candidates = [
    "value",
    "ars",
    "price_ars",
    "promedio",
    "venta",
    "sell",
    "price",
  ];
  for (const key of candidates) {
    const v = quote[key];
    if (typeof v === "number") return v;
  }
  return null;
}

// idem pero para % de cambio 24 hs
function pickChange(quote: any): number | null {
  if (!quote) return null;
  const candidates = ["change24h", "var24hs", "change_pct", "diff24h"];
  for (const key of candidates) {
    const v = quote[key];
    if (typeof v === "number") return v;
  }
  return null;
}
