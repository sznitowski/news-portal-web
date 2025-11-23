"use client";

import React, { useMemo } from "react";
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

type Props = {
  snapshots: EconomyDailySnapshot[];
};

function formatPeso(value: number | null | undefined) {
  if (value == null || isNaN(value)) return "-";
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });
}

function parseValue(raw: number | string | null): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return raw;
  // por si viene "1406,50"
  const normalized = raw.replace(".", "").replace(",", ".");
  const n = Number(normalized);
  return isNaN(n) ? null : n;
}

const EconomyPanelSection: React.FC<Props> = ({ snapshots }) => {
  const { chartData, latest, prevDay, prevWeek } = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return { chartData: [], latest: null, prevDay: null, prevWeek: null };
    }

    // orden ascendente por fecha
    const ordered = [...snapshots].sort((a, b) =>
      a.snapshot_date.localeCompare(b.snapshot_date),
    );

    const chartData = ordered.map((s) => {
      const v = parseValue(s.dolar_oficial_venta);
      const date = new Date(s.snapshot_date);
      const label = isNaN(date.getTime())
        ? s.snapshot_date
        : date.toLocaleDateString("es-AR", {
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

    return { chartData, latest, prevDay, prevWeek };
  }, [snapshots]);

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-300">
        Todavía no hay datos diarios guardados.
        Una vez que el cron corra y llene la tabla, acá vas a ver el panel.
      </div>
    );
  }

  const latestValue = latest?.value ?? null;
  const prevDayValue = prevDay?.value ?? null;
  const prevWeekValue = prevWeek?.value ?? null;

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

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Último valor */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Dólar oficial venta
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {formatPeso(latestValue)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Último dato:{" "}
            {latest?.rawDate
              ? new Date(latest.rawDate).toLocaleDateString("es-AR")
              : "-"}
          </p>
        </div>

        {/* Variación diaria */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Variación diaria
          </p>
          <p className={`mt-2 text-xl font-semibold ${trendDayColor}`}>
            {diffDay == null
              ? "-"
              : `${diffDay >= 0 ? "+" : ""}${diffDay.toFixed(2)}`}
          </p>
          <p className={`mt-1 text-xs ${trendDayColor}`}>
            {diffDayPct == null
              ? ""
              : `${diffDayPct >= 0 ? "+" : ""}${diffDayPct.toFixed(2)}%`}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            vs. día hábil anterior
          </p>
        </div>

        {/* Variación semanal */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Variación 7 días
          </p>
          <p className={`mt-2 text-xl font-semibold ${trendWeekColor}`}>
            {diffWeek == null
              ? "-"
              : `${diffWeek >= 0 ? "+" : ""}${diffWeek.toFixed(2)}`}
          </p>
          <p className={`mt-1 text-xs ${trendWeekColor}`}>
            {diffWeekPct == null
              ? ""
              : `${diffWeekPct >= 0 ? "+" : ""}${diffWeekPct.toFixed(2)}%`}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            vs. hace 7 días
          </p>
        </div>
      </div>

      {/* Gráfico de línea */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-50">
              Histórico últimos {snapshots.length} días
            </h2>
            <p className="text-xs text-zinc-400">
              Dólar oficial venta (cierre diario)
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
                formatter={(val: any) => [formatPeso(val as number), "Venta"]}
                labelFormatter={(label: any) => `Fecha: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla simple con últimos días */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-50">Detalle diario</h2>
          <p className="text-xs text-zinc-400">
            Datos ordenados por fecha (más reciente al final)
          </p>
        </div>

        <div className="max-h-80 overflow-auto rounded-lg border border-zinc-800">
          <table className="min-w-full text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Fecha</th>
                <th className="px-3 py-2 text-right font-medium">
                  Dólar oficial venta
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
