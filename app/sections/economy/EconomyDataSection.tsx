// app/sections/economy/EconomyDataSection.tsx
"use client";

import { useSearchParams } from "next/navigation";
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

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "-";
  return (
    new Intl.NumberFormat("es-AR", {
      maximumFractionDigits: 1,
    }).format(value) + " %"
  );
}

function formatNumber(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMillionsArs(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "-";
  return (
    new Intl.NumberFormat("es-AR", {
      maximumFractionDigits: 0,
    }).format(value) + " M ARS"
  );
}

function calcSpread(base?: number | null, other?: number | null): number | null {
  if (base == null || other == null || base === 0) return null;
  return ((other - base) / base) * 100;
}

// Para las fechas de IPC (ej: "2025-04-01" → "abr. 2025")
function formatMonthLabel(date: string | null | undefined) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("es-AR", {
    month: "short",
    year: "numeric",
  });
}

export default function EconomyDataSection({
  dolar,
  crypto: _crypto,
  bcra,
  budget,
  indec,
  countryRisk,
  loading,
}: Props) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  // Solo mostrar cuando estás en Economía
  const isEconomy = !category || category === "economia";
  if (!isEconomy) return null;

  if (loading && !dolar && !bcra && !budget && countryRisk == null && !indec) {
    return null;
  }

  // ======= DÓLAR =======
  const oficial = dolar?.oficial ?? null;
  const blue = dolar?.blue ?? null;
  const mep = (dolar as any)?.mep ?? null;
  const ccl = (dolar as any)?.ccl ?? null;

  const spreadBlue = calcSpread(oficial?.venta ?? null, blue?.venta ?? null);
  const spreadMep = calcSpread(oficial?.venta ?? null, mep?.venta ?? null);
  const spreadCcl = calcSpread(oficial?.venta ?? null, ccl?.venta ?? null);

  // ======= BCRA =======
  const reservasUsdM = bcra?.reservas?.valor ?? null;
  const badlar = bcra?.tasaBadlarPrivados?.valor ?? null;
  const tm20 = bcra?.tasaTm20Privados?.valor ?? null;

  // ======= PRESUPUESTO =======
  const totalRevenue = budget?.totalRevenue ?? null;
  const totalSpending = budget?.totalSpending ?? null;
  const primaryBalance = budget?.primaryBalance ?? null;

  const primaryAsRevenuePct =
    totalRevenue != null && primaryBalance != null && totalRevenue !== 0
      ? (primaryBalance / totalRevenue) * 100
      : null;

  // ======= INDEC – IPC =======
  const ipcMonthlyLast = indec?.ipcMonthlyLast ?? null;
  const ipcYoYLast = indec?.ipcYoYLast ?? null;
  const ipcAccumYear = indec?.ipcAccumYear ?? null;

  // En la API vienen como fracción (0.0278 = 2.78 %)
  const ipcMonthlyPct =
    ipcMonthlyLast?.value != null ? ipcMonthlyLast.value * 100 : null;
  const ipcYoYPct =
    ipcYoYLast?.value != null ? ipcYoYLast.value * 100 : null;
  const ipcAccumYearPct =
    ipcAccumYear != null ? ipcAccumYear * 100 : null;

  return (
    <section className="mx-auto mt-6 max-w-6xl space-y-4 px-4 pb-12">
      <header className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Lectura rápida de los datos
          </h2>
          <p className="mt-1 text-[12px] text-slate-500">
            Brechas cambiarias, reservas del BCRA, inflación y resultado primario del
            presupuesto.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Brecha cambiaria */}
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">
            Brecha cambiaria
          </h3>
          <p className="mt-1 text-[12px] text-slate-400">
            Diferencia contra el dólar oficial (venta).
          </p>

          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Blue vs oficial</dt>
              <dd
                className={`font-semibold ${
                  spreadBlue != null && spreadBlue > 0
                    ? "text-emerald-600"
                    : "text-slate-700"
                }`}
              >
                {formatPercent(spreadBlue)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-slate-600">MEP vs oficial</dt>
              <dd
                className={`font-semibold ${
                  spreadMep != null && spreadMep > 0
                    ? "text-emerald-600"
                    : "text-slate-700"
                }`}
              >
                {formatPercent(spreadMep)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-slate-600">CCL vs oficial</dt>
              <dd
                className={`font-semibold ${
                  spreadCcl != null && spreadCcl > 0
                    ? "text-emerald-600"
                    : "text-slate-700"
                }`}
              >
                {formatPercent(spreadCcl)}
              </dd>
            </div>
          </dl>
        </article>

        {/* Reservas y tasas */}
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">
            Reservas y tasas BCRA
          </h3>
          <p className="mt-1 text-[12px] text-slate-400">
            Stock de reservas y principales tasas de referencia.
          </p>

          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Reservas internacionales</dt>
              <dd className="font-semibold text-slate-800">
                {formatNumber(reservasUsdM)} M USD
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-slate-600">BADLAR bancos privados</dt>
              <dd className="font-semibold text-slate-800">
                {formatPercent(badlar)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-slate-600">TM20 bancos privados</dt>
              <dd className="font-semibold text-slate-800">
                {formatPercent(tm20)}
              </dd>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <dt className="text-slate-600">Riesgo país (EMBI+ ARG)</dt>
              <dd className="font-semibold text-slate-800">
                {countryRisk != null ? `${formatNumber(countryRisk)} pts` : "-"}
              </dd>
            </div>
          </dl>
        </article>

        {/* Presupuesto / resultado primario */}
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">
            Cuentas públicas
          </h3>
          <p className="mt-1 text-[12px] text-slate-400">
            Totales acumulados del presupuesto nacional (millones de pesos).
          </p>

          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Recursos percibidos</dt>
              <dd className="font-semibold text-slate-800">
                {formatMillionsArs(totalRevenue)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Gasto primario devengado</dt>
              <dd className="font-semibold text-slate-800">
                {formatMillionsArs(totalSpending)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Resultado primario</dt>
              <dd
                className={`font-semibold ${
                  primaryBalance != null && primaryBalance < 0
                    ? "text-rose-600"
                    : primaryBalance != null && primaryBalance > 0
                    ? "text-emerald-600"
                    : "text-slate-800"
                }`}
              >
                {formatMillionsArs(primaryBalance)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-slate-600">
                Resultado / ingresos (% acumulado)
              </dt>
              <dd
                className={`font-semibold ${
                  primaryAsRevenuePct != null && primaryAsRevenuePct < 0
                    ? "text-rose-600"
                    : primaryAsRevenuePct != null && primaryAsRevenuePct > 0
                    ? "text-emerald-600"
                    : "text-slate-800"
                }`}
              >
                {formatPercent(primaryAsRevenuePct)}
              </dd>
            </div>
          </dl>

          {budget?.raw?.total?.ultima_actualizacion_fecha && (
            <p className="mt-3 text-[11px] text-slate-400">
              Última actualización:{" "}
              {budget.raw.total.ultima_actualizacion_fecha}
            </p>
          )}
        </article>

        {/* Inflación y bolsillo */}
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">
            Inflación y bolsillo
          </h3>
          <p className="mt-1 text-[12px] text-slate-400">
            Variación de precios al consumidor (IPC INDEC), mensual, anual y
            acumulada en el año.
          </p>

          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Inflación mensual</dt>
              <dd className="font-semibold text-slate-800">
                {formatPercent(ipcMonthlyPct)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Inflación interanual</dt>
              <dd className="font-semibold text-slate-800">
                {formatPercent(ipcYoYPct)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Acumulada en el año</dt>
              <dd className="font-semibold text-slate-800">
                {formatPercent(ipcAccumYearPct)}
              </dd>
            </div>
          </dl>

          {ipcMonthlyLast && (
            <p className="mt-3 text-[11px] text-slate-400">
              Último dato: {formatMonthLabel(ipcMonthlyLast.date)} (INDEC).
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
