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
    <main style={{ padding: 24 }}>
      {isEconomy && <EconomiaSection />}

      {/* Sacamos este bloque */}
      {/* <CasaRosadaStrip /> */}

      <NewsListSection category={category} />
    </main>
  );
}
