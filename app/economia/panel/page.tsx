// app/economia/panel/page.tsx
import { fetchEconomyDaily } from "../../lib/economy";
import EconomyPanelSection from "../../sections/economy/EconomyPanelSection";
import type { EconomyDailySnapshot } from "../../types/economy";

export const dynamic = "force-dynamic";

export default async function EconomyPanelPage() {
  let snapshots: EconomyDailySnapshot[] = [];

  try {
    snapshots = await fetchEconomyDaily({ limit: 30 });
  } catch (e) {
    console.error("Error trayendo snapshots diarios", e);
  }

  return (
    <div className="space-y-6">
      <EconomyPanelSection snapshots={snapshots} />
    </div>
  );
}
