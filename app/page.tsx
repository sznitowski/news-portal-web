// app/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import EconomiaSection from "./sections/EconomiaSection";
import NewsListSection from "./sections/NewsListSection";

export default function HomePage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;
  const isEconomy = category === "economia";

  return (
    <main style={{ padding: 24 }}>
      {/* Economía sólo cuando category=economia */}
      {isEconomy && <EconomiaSection />}

      {/* Lista de noticias (con buscador + titulares) */}
      <NewsListSection category={category} />
    </main>
  );
}
