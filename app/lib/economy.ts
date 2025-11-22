// app/lib/economy.ts

import type { IndecSummary } from "../types/economy";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export async function fetchIndecSummary(): Promise<IndecSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/economy/indec`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as IndecSummary;
  } catch (e) {
    console.error("Error cargando INDEC", e);
    return null;
  }
}
