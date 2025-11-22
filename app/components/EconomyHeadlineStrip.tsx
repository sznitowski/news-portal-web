// app/components/EconomyHeadlineStrip.tsx
"use client";

import type { DolarResponse, CryptoResponse } from "../types/market";

type Props = {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null; // por ahora no lo usamos, pero lo dejamos tipado
  loading?: boolean;
};

const DOLAR_ITEMS = [
  { key: "oficial", label: "DÓLAR OFICIAL" },
  { key: "tarjeta", label: "DÓLAR TARJETA" },
  { key: "blue", label: "DÓLAR BLUE" },
  { key: "mep", label: "DÓLAR MEP" },
  { key: "ccl", label: "CONTADO CON LIQUI" },
] as const;

type DolarKey = (typeof DOLAR_ITEMS)[number]["key"];

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function EconomyHeadlineStrip({ dolar, loading }: Props) {
  // si todavía no tenemos nada y estamos cargando, mostramos un mensajito
  if (loading && !dolar) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-500 shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
        Cargando cotizaciones del dólar...
      </div>
    );
  }

  // si no hay datos, no mostramos nada
  if (!dolar) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      {/* cabecera */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-50">
            Panorama económico
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Dólar en pesos argentinos.
          </span>
        </div>
        <span className="ml-auto text-[11px] text-slate-400">
          Variación de referencia diaria.
        </span>
      </div>

      {/* tarjetas del dólar */}
      <div className="mt-4 flex flex-wrap gap-3">
        {DOLAR_ITEMS.map(({ key, label }) => {
          const quote = dolar[key as DolarKey];
          if (!quote) return null;

          return (
            <div
              key={key}
              className="min-w-[150px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {label}
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {formatArs(quote.venta)}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Compra {formatArs(quote.compra)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
