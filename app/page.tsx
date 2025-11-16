// app/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import EconomiaSection from "./sections/EconomiaSection";
import NewsListSection from "./sections/NewsListSection";
// import CasaRosadaStrip from "./sections/CasaRosadaStrip";

export default function HomePage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;
  const isEconomy = category === "economia";

  return (
    <div style={{ padding: 24 }}>
      {isEconomy && <EconomiaSection />}

      {/* Si en algún momento querés volver a mostrar la franja de Casa Rosada, se reactiva esto */}
      {/* <CasaRosadaStrip /> */}

      <NewsListSection category={category} />
    </div>
  );
}
