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
  indec?: IndecSummary | null;
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

function formatCurrencyArs(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
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
  crypto,
  bcra,
  budget,
  indec,
  countryRisk,
  loading,
}: Props) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const view = searchParams.get("view");

  // Este panel sólo se muestra en Inicio / Economía
  const isEconomy = !category || category === "economia";
  if (!isEconomy) return null;

  if (loading && !dolar && !bcra && !budget && countryRisk == null && !indec) {
    return null;
  }

  // Modo según el "view" del dropdown
  type Mode = "summary" | "dolarCrypto" | "bcra" | "budget";
  const mode: Mode =
    view === "dolar-cripto"
      ? "dolarCrypto"
      : view === "bcra"
      ? "bcra"
      : view === "presupuesto"
      ? "budget"
      : "summary";

  // Datos comunes
  const oficial = dolar?.oficial ?? null;
  const blue = dolar?.blue ?? null;
  const mep = (dolar as any)?.mep ?? null;
  const ccl = (dolar as any)?.ccl ?? null;
  const tarjeta = dolar?.tarjeta ?? null;

  const btc = crypto?.bitcoin ?? null;
  const eth = crypto?.ethereum ?? null;
  const sol = crypto?.solana ?? null;

  const reservasUsdM = bcra?.reservas?.valor ?? null;
  const badlar = bcra?.tasaBadlarPrivados?.valor ?? null;
  const tm20 = bcra?.tasaTm20Privados?.valor ?? null;

  const totalRevenue = budget?.totalRevenue ?? null;
  const totalSpending = budget?.totalSpending ?? null;
  const primaryBalance = budget?.primaryBalance ?? null;

  const primaryAsRevenuePct =
    totalRevenue != null && primaryBalance != null && totalRevenue !== 0
      ? (primaryBalance / totalRevenue) * 100
      : null;

  const ipcMonthlyLast = indec?.ipcMonthlyLast ?? null;
  const ipcYoYLast = indec?.ipcYoYLast ?? null;
  const ipcAccumYear = indec?.ipcAccumYear ?? null;

  const ipcMonthlyPct =
    ipcMonthlyLast?.value != null ? ipcMonthlyLast.value * 100 : null;
  const ipcYoYPct =
    ipcYoYLast?.value != null ? ipcYoYLast.value * 100 : null;
  const ipcAccumYearPct =
    ipcAccumYear != null ? ipcAccumYear * 100 : null;

  const spreadBlue = calcSpread(oficial?.venta ?? null, blue?.venta ?? null);
  const spreadMep = calcSpread(oficial?.venta ?? null, mep?.venta ?? null);
  const spreadCcl = calcSpread(oficial?.venta ?? null, ccl?.venta ?? null);

  // ============================
  // 1) RESUMEN (default)
  // ============================
  if (mode === "summary") {
    return (
      <section className="mx-auto mt-6 max-w-6xl space-y-4 px-4 pb-12">
        <header className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Lectura rápida de los datos
            </h2>
            <p className="mt-1 text-[12px] text-slate-500">
              Brechas cambiarias, reservas del BCRA, inflación y resultado
              primario del presupuesto.
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

            <p className="mt-3 text-[11px] text-slate-400">
              Cuando estas brechas son altas, es más difícil sostener precios y
              acuerdos en pesos.
            </p>
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
                  {countryRisk != null
                    ? `${formatNumber(countryRisk)} pts`
                    : "-"}
                </dd>
              </div>
            </dl>
          </article>

          {/* Cuentas públicas */}
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
          </article>

          {/* Inflación */}
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">
              Inflación y bolsillo
            </h3>
            <p className="mt-1 text-[12px] text-slate-400">
              Variación de precios al consumidor, mensual y anual.
            </p>

            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Inflación mensual</dt>
                <dd className="font-semibold text-slate-800">
                  {formatPercent(ipcMonthlyPct)}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Inflación anual</dt>
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

  // ============================
  // 2) DÓLAR + CRIPTO (view=dolar-cripto)
  // ============================
  if (mode === "dolarCrypto") {
    return (
      <section className="mx-auto mt-6 max-w-6xl space-y-6 px-4 pb-12">
        <header>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Dólar y criptomonedas
          </h2>
          <p className="mt-1 text-[12px] text-slate-500">
            Cotizaciones del dólar en sus principales variantes y precios de
            las criptomonedas más usadas.
          </p>
        </header>

        {/* Tira horizontal de tipos de dólar */}
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {[
              { label: "Oficial", quote: oficial },
              { label: "Blue", quote: blue },
              { label: "MEP", quote: mep },
              { label: "CCL", quote: ccl },
              { label: "Tarjeta", quote: tarjeta },
            ].map(({ label, quote }) => (
              <div
                key={label}
                className="min-w-[140px] rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.10)]"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {label}
                </div>
                <div className="mt-1 text-[20px] font-semibold text-slate-900 leading-tight">
                  {formatCurrencyArs(quote?.venta ?? null)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Compra: {formatCurrencyArs(quote?.compra ?? null)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cripto */}
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">
              Bitcoin (BTC)
            </h3>
            <p className="mt-1 text-[12px] text-slate-400">
              Referencia global del mercado cripto.
            </p>
            <p className="mt-3 text-[24px] font-semibold text-slate-900">
              {btc?.usd != null ? `${formatNumber(btc.usd)} USD` : "-"}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">
              Ethereum (ETH)
            </h3>
            <p className="mt-1 text-[12px] text-slate-400">
              Segunda cripto en importancia a nivel global.
            </p>
            <p className="mt-3 text-[24px] font-semibold text-slate-900">
              {eth?.usd != null ? `${formatNumber(eth.usd)} USD` : "-"}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">
              Solana (SOL)
            </h3>
            <p className="mt-1 text-[12px] text-slate-400">
              Red de contratos inteligentes de bajo costo.
            </p>
            <p className="mt-3 text-[24px] font-semibold text-slate-900">
              {sol?.usd != null ? `${formatNumber(sol.usd)} USD` : "-"}
            </p>
          </article>
        </div>
      </section>
    );
  }

  // ============================
  // 3) INDICADORES BCRA (view=bcra)
  // ============================
  if (mode === "bcra") {
    return (
      <section className="mx-auto mt-6 max-w-6xl space-y-4 px-4 pb-12">
        <header>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Indicadores BCRA
          </h2>
          <p className="mt-1 text-[12px] text-slate-500">
            Reservas internacionales, tasas de referencia y riesgo país.
          </p>
        </header>

        <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
          <dl className="space-y-2 text-[13px]">
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
      </section>
    );
  }

  // ============================
  // 4) PRESUPUESTO / DÉFICIT (view=presupuesto)
  // ============================
  return (
    <section className="mx-auto mt-6 max-w-6xl space-y-4 px-4 pb-12">
      <header>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Presupuesto y resultado fiscal
        </h2>
        <p className="mt-1 text-[12px] text-slate-500">
          Recursos, gasto primario, resultado primario y relación con los
          ingresos.
        </p>
      </header>

      <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
        <dl className="space-y-2 text-[13px]">
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
            Última actualización: {budget.raw.total.ultima_actualizacion_fecha}
          </p>
        )}
      </article>
    </section>
  );
}
