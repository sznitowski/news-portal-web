// app/sections/economy/EconomyPanelSection.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { EconomyDailySnapshot } from "../../types/economy";
import type { CryptoResponse } from "../../types/market";

type Props = {
  snapshots: EconomyDailySnapshot[];
  crypto?: CryptoResponse | null;
};

// === helpers numéricos ===
function parseNumber(raw: number | string | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return isNaN(raw) ? null : raw;
  const normalized = raw.replace(".", "").replace(",", ".");
  const n = Number(normalized);
  return isNaN(n) ? null : n;
}

function formatPeso(value: number | null | undefined) {
  if (value == null || isNaN(value)) return "-";
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });
}

function formatPct(value: number | null | undefined) {
  if (value == null || isNaN(value)) return "";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// ==== tipos de dólar que vamos a soportar en el selector ====
type DolarKey =
  | "dolar_oficial_venta"
  | "dolar_blue_venta"
  | "dolar_mep_venta"
  | "dolar_ccl_venta";

const DOLAR_OPTIONS: { key: DolarKey; label: string }[] = [
  { key: "dolar_oficial_venta", label: "Dólar oficial (venta)" },
  { key: "dolar_blue_venta", label: "Dólar blue (venta)" },
  { key: "dolar_mep_venta", label: "Dólar MEP (venta)" },
  { key: "dolar_ccl_venta", label: "Contado con liqui (venta)" },
];

// ==== Crypto mini-tag ====
function CryptoPill({
  label,
  priceArs,
  changePct,
}: {
  label: string;
  priceArs: number | null | undefined;
  changePct: number | null | undefined;
}) {
  const val = priceArs ?? null;
  const change = changePct ?? null;

  const changeColor =
    change == null
      ? "text-zinc-400"
      : change >= 0
      ? "text-emerald-400"
      : "text-red-400";

  return (
    <div className="rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3 py-1 text-right shadow-sm">
      <p className="text-[11px] font-semibold text-zinc-50">{label}</p>
      <p className="text-[11px] text-zinc-200">
        {val == null ? "-" : formatPeso(val)}
      </p>
      <p className={`text-[10px] ${changeColor}`}>
        {change == null ? "" : formatPct(change)}
      </p>
    </div>
  );
}

const EconomyPanelSection: React.FC<Props> = ({ snapshots, crypto }) => {
  const [dolarKey, setDolarKey] = useState<DolarKey>("dolar_oficial_venta");
  const [range, setRange] = useState<"7" | "30" | "all">("30");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const {
    chartData,
    latestValue,
    prevDayValue,
    prevWeekValue,
    latestDateLabel,
  } = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return {
        chartData: [] as { date: string; rawDate: string; value: number | null }[],
        latestValue: null as number | null,
        prevDayValue: null as number | null,
        prevWeekValue: null as number | null,
        latestDateLabel: "-",
      };
    }

    // Orden ascendente por fecha
    const ordered = [...snapshots].sort((a, b) =>
      a.snapshot_date.localeCompare(b.snapshot_date),
    );

    // Filtro de rango (7 / 30 / todo)
    let ranged = ordered;
    if (range !== "all") {
      const days = range === "7" ? 7 : 30;
      if (ranged.length > days) {
        ranged = ranged.slice(ranged.length - days);
      }
    }

    // Filtro por fechas desde/hasta (front, no pega de nuevo al backend)
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    let filtered = ranged;
    if (fromDate) {
      filtered = filtered.filter((s) => {
        const d = new Date(s.snapshot_date);
        return !isNaN(d.getTime()) && d >= fromDate;
      });
    }
    if (toDate) {
      filtered = filtered.filter((s) => {
        const d = new Date(s.snapshot_date);
        return !isNaN(d.getTime()) && d <= toDate;
      });
    }

    const chartData = filtered.map((s) => {
      const raw = (s as any)[dolarKey] ?? null; // key dinámica
      const v = parseNumber(raw);
      const dateObj = new Date(s.snapshot_date);
      const label = isNaN(dateObj.getTime())
        ? s.snapshot_date
        : dateObj.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
          });

      return {
        date: label,
        rawDate: s.snapshot_date,
        value: v,
      };
    });

    const latest = chartData[chartData.length - 1] ?? null;
    const prevDay = chartData[chartData.length - 2] ?? null;
    const prevWeek =
      chartData.length > 7 ? chartData[chartData.length - 8] : null;

    return {
      chartData,
      latestValue: latest?.value ?? null,
      prevDayValue: prevDay?.value ?? null,
      prevWeekValue: prevWeek?.value ?? null,
      latestDateLabel: latest?.rawDate
        ? new Date(latest.rawDate).toLocaleDateString("es-AR")
        : "-",
    };
  }, [snapshots, dolarKey, range, from, to]);

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-6 text-sm text-zinc-300">
        Todavía no hay datos diarios guardados. Una vez que el cron corra y
        llene la tabla, acá vas a ver el panel.
      </div>
    );
  }

  const diffDay =
    latestValue != null && prevDayValue != null
      ? latestValue - prevDayValue
      : null;
  const diffDayPct =
    diffDay != null && prevDayValue
      ? (diffDay / prevDayValue) * 100
      : null;

  const diffWeek =
    latestValue != null && prevWeekValue != null
      ? latestValue - prevWeekValue
      : null;
  const diffWeekPct =
    diffWeek != null && prevWeekValue
      ? (diffWeek / prevWeekValue) * 100
      : null;

  const trendDayColor =
    diffDay == null
      ? "text-zinc-400"
      : diffDay >= 0
      ? "text-emerald-400"
      : "text-red-400";
  const trendWeekColor =
    diffWeek == null
      ? "text-zinc-400"
      : diffWeek >= 0
      ? "text-emerald-400"
      : "text-red-400";

  const latestLabel = DOLAR_OPTIONS.find((o) => o.key === dolarKey)?.label;

  // crypto principal (BTC / ETH / SOL)
  const btc = crypto?.bitcoin ?? null;
  const eth = crypto?.ethereum ?? null;
  const sol = crypto?.solana ?? null;

  // Factor de conversión a ARS: usamos el último valor del dólar seleccionado
  const fxArsPerUsd = latestValue ?? null;

  return (
    <div className="space-y-6">
      {/* Panel de CRIPTO arriba, con fondo más claro y bordes marcados */}
      {crypto && (btc || eth || sol) && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/90 px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.32)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
                Criptomonedas (referencia)
              </p>
              <p className="text-xs text-zinc-400">
                Precios estimados en pesos. Ideal para cruzar con la serie de
                dólar seleccionada.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              {btc && (
                <CryptoPill
                  label="Bitcoin (BTC)"
                  priceArs={
                    fxArsPerUsd != null && btc.usd != null
                      ? btc.usd * fxArsPerUsd
                      : null
                  }
                  changePct={btc.usd_24h_change ?? null}
                />
              )}
              {eth && (
                <CryptoPill
                  label="Ethereum (ETH)"
                  priceArs={
                    fxArsPerUsd != null && eth.usd != null
                      ? eth.usd * fxArsPerUsd
                      : null
                  }
                  changePct={eth.usd_24h_change ?? null}
                />
              )}
              {sol && (
                <CryptoPill
                  label="Solana (SOL)"
                  priceArs={
                    fxArsPerUsd != null && sol.usd != null
                      ? sol.usd * fxArsPerUsd
                      : null
                  }
                  changePct={sol.usd_24h_change ?? null}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controles arriba */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        {/* Tipo de dólar */}
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-zinc-400">Tipo de dólar:</span>
          <select
            className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none focus:border-emerald-400"
            value={dolarKey}
            onChange={(e) => setDolarKey(e.target.value as DolarKey)}
          >
            {DOLAR_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtros de fecha */}
        <div className="flex flex-wrap items-end gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-zinc-400">Desde:</span>
            <input
              type="date"
              className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none focus:border-emerald-400"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-medium text-zinc-400">Hasta:</span>
            <input
              type="date"
              className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none focus:border-emerald-400"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="mt-4 h-9 rounded-full border border-zinc-600 bg-zinc-900 px-3 text-xs text-zinc-200 hover:border-zinc-400"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Limpiar fechas
          </button>

          {/* Rango rápido */}
          <div className="ml-0 flex flex-col gap-1 md:ml-4">
            <span className="font-medium text-zinc-400">Rango:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRange("7")}
                className={`h-8 rounded-full px-3 text-xs ${
                  range === "7"
                    ? "bg-emerald-500 text-white"
                    : "border border-zinc-700 bg-zinc-900 text-zinc-200"
                }`}
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => setRange("30")}
                className={`h-8 rounded-full px-3 text-xs ${
                  range === "30"
                    ? "bg-emerald-500 text-white"
                    : "border border-zinc-700 bg-zinc-900 text-zinc-200"
                }`}
              >
                30 días
              </button>
              <button
                type="button"
                onClick={() => setRange("all")}
                className={`h-8 rounded-full px-3 text-xs ${
                  range === "all"
                    ? "bg-emerald-500 text-white"
                    : "border border-zinc-700 bg-zinc-900 text-zinc-200"
                }`}
              >
                Todo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen dólar */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Último valor */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/95 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            {latestLabel}
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {formatPeso(latestValue)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Último dato: {latestDateLabel}
          </p>
        </div>

        {/* Variación diaria */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/95 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Variación diaria
          </p>
          <p className={`mt-2 text-xl font-semibold ${trendDayColor}`}>
            {diffDay == null
              ? "-"
              : `${diffDay >= 0 ? "+" : ""}${diffDay.toFixed(2)}`}
          </p>
          <p className={`mt-1 text-xs ${trendDayColor}`}>
            {diffDayPct == null ? "" : formatPct(diffDayPct)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">vs. día hábil anterior</p>
        </div>

        {/* Variación semanal */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/95 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Variación 7 días
          </p>
          <p className={`mt-2 text-xl font-semibold ${trendWeekColor}`}>
            {diffWeek == null
              ? "-"
              : `${diffWeek >= 0 ? "+" : ""}${diffWeek.toFixed(2)}`}
          </p>
          <p className={`mt-1 text-xs ${trendWeekColor}`}>
            {diffWeekPct == null ? "" : formatPct(diffWeekPct)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">vs. hace 7 días</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/95 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-50">
              Histórico ({latestLabel}) —{" "}
              {range === "all" ? "todos los días" : `${range} días`}
            </h2>
            <p className="text-xs text-zinc-400">
              Valores de cierre diario según el rango seleccionado.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#a1a1aa" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#a1a1aa" }}
                tickLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(val: any) => [formatPeso(val as number), "Valor"]}
                labelFormatter={(label: any) => `Fecha: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla detalle */}
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/95 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-50">Detalle diario</h2>
          <p className="text-xs text-zinc-400">
            Datos ordenados por fecha (más reciente al final) según el rango
            seleccionado.
          </p>
        </div>

        <div className="max-h-80 overflow-auto rounded-lg border border-zinc-800">
          <table className="min-w-full text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Fecha</th>
                <th className="px-3 py-2 text-right font-medium">
                  {latestLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr
                  key={row.rawDate}
                  className="border-t border-zinc-800/80 odd:bg-zinc-950/60 even:bg-zinc-900/40"
                >
                  <td className="px-3 py-1.5 text-left text-zinc-100">
                    {new Date(row.rawDate).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-3 py-1.5 text-right text-zinc-100">
                    {formatPeso(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EconomyPanelSection;
