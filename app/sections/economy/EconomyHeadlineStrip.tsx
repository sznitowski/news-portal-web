// app/components/EconomyHeadlineStrip.tsx
"use client";


import type { DolarResponse, CryptoResponse } from "../../types/market";

type Props = {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null; // lo aceptamos por si después lo usamos
  loading: boolean;
};

const DOLAR_ITEMS: { key: keyof DolarResponse; label: string }[] = [
  { key: "oficial", label: "DÓLAR OFICIAL" },
  { key: "tarjeta", label: "DÓLAR TARJETA" },
  { key: "blue", label: "DÓLAR BLUE" },
  { key: "mep", label: "DÓLAR MEP" },
  { key: "ccl", label: "CONTADO CON LIQUI" },
];

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function EconomyHeadlineStrip({
  dolar,
  crypto: _crypto, // evitamos warning de parámetro sin usar
  loading,
}: Props) {
  // Estado de carga arriba de todo
  if (loading && !dolar) {
    return (
      <section className="rounded-[28px] bg-white/80 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 md:px-6">
        <div className="mb-3 h-3 w-40 rounded-full bg-slate-100" />
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-slate-100 bg-slate-50/80"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!dolar) return null;

  return (
    <section className="rounded-[28px] bg-white/90 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.20)] ring-1 ring-slate-200 md:px-6">
      {/* cabecera tipo “Panorama económico” */}
      <header className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Panorama económico
        </h2>
        <p className="hidden text-[11px] text-slate-400 sm:block">
          Dólar en pesos argentinos. Referencia diaria.
        </p>
      </header>

      {/* tarjetas de dólar tipo Infobae */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {DOLAR_ITEMS.map(({ key, label }) => {
          const quote = dolar[key] as any;
          if (!quote) return null;

          // Si en el futuro tenés variación, la podés colgar acá.
          // Por ahora solo mostramos el texto “Últimas 24 hs”.
          const changeIcon = "●";
          const changeText = "Últimas 24 hs";

          return (
            <article
              key={key}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">
                {label}
              </p>

              <p className="mt-1 text-2xl font-semibold leading-tight text-slate-900">
                {formatArs(quote.venta)}
              </p>

              <div className="mt-1 flex items-end justify-between text-[11px]">
                <span className="text-slate-500">
                  Compra {formatArs(quote.compra)}
                </span>

                <span className="flex items-center gap-1 text-slate-400">
                  <span>{changeIcon}</span>
                  <span>{changeText}</span>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
