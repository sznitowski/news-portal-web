// app/lib/economy.ts
import { buildApiUrl } from "./api";
import type { IndecSummary, EconomyDailySnapshot } from "../types/economy";

// ===============================
// SNAPSHOTS DIARIOS (PANEL)
// ===============================

type FetchEconomyDailyOptions = {
  limit?: number;
  from?: string;
  to?: string;
};

async function fetchDailyFrom(path: string, options: FetchEconomyDailyOptions) {
  const params = new URLSearchParams();

  if (options.limit != null) params.set("limit", String(options.limit));
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);

  const qs = params.toString();
  const url = buildApiUrl(`${path}${qs ? `?${qs}` : ""}`);

  // Para ver claramente en la consola de Next qué URL se está pegando
  console.log("[fetchEconomyDaily] GET", url);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[fetchEconomyDaily] HTTP error", res.status, path);
      return [] as EconomyDailySnapshot[];
    }

    const data = await res.json();

    // Soportamos varios formatos típicos: [] directo, { items: [] }, { rows: [] }
    if (Array.isArray(data)) {
      return data as EconomyDailySnapshot[];
    }
    if (Array.isArray((data as any).items)) {
      return (data as any).items as EconomyDailySnapshot[];
    }
    if (Array.isArray((data as any).rows)) {
      return (data as any).rows as EconomyDailySnapshot[];
    }

    console.warn("[fetchEconomyDaily] Formato inesperado", data);
    return [] as EconomyDailySnapshot[];
  } catch (e) {
    console.error("[fetchEconomyDaily] Error de red/parse", e);
    return [] as EconomyDailySnapshot[];
  }
}

/**
 * Trae los snapshots diarios de la tabla economy_daily_snapshot.
 * Intenta dos rutas posibles:
 *   - /economy/daily
 *   - /economy/daily-snapshot
 * Dejá la que corresponda a tu API; la otra sirve como fallback.
 */
export async function fetchEconomyDaily(
  options: FetchEconomyDailyOptions = {},
): Promise<EconomyDailySnapshot[]> {
  // 1) Intento principal (ajustá este path si tu controller usa otro)
  let result = await fetchDailyFrom("/economy/daily", options);
  if (result.length > 0) return result;

  // 2) Fallback por si el endpoint se llama distinto
  result = await fetchDailyFrom("/economy/daily-snapshot", options);
  return result;
}

// ===============================
// INDEC
// ===============================

export async function fetchIndecSummary(): Promise<IndecSummary | null> {
  const url = buildApiUrl("/economy/indec");

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as IndecSummary;
  } catch (e) {
    console.error("Error cargando INDEC", e);
    return null;
  }
}
