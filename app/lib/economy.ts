// app/lib/economy.ts
import { buildApiUrl } from "./api";
import type { IndecSummary, EconomyDailySnapshot } from "../types/economy";

type FetchEconomyDailyOptions = {
  limit?: number;
  from?: string;
  to?: string;
};

export async function fetchEconomyDaily(
  options: FetchEconomyDailyOptions = {},
): Promise<EconomyDailySnapshot[]> {
  const params = new URLSearchParams();
  if (options.limit != null) params.set("limit", String(options.limit));
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);

  const qs = params.toString();
  const url = buildApiUrl(`/economy/daily${qs ? `?${qs}` : ""}`);

  console.log("[fetchEconomyDaily] GET", url);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[fetchEconomyDaily] HTTP error", res.status);
      return [];
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      return data as EconomyDailySnapshot[];
    }

    console.warn("[fetchEconomyDaily] Formato inesperado", data);
    return [];
  } catch (e) {
    console.error("[fetchEconomyDaily] Error", e);
    return [];
  }
}

// INDEC (lo que ya tenías)
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
