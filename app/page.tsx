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
    <main className="mx-auto max-w-5xl px-4 py-8">
      {isEconomy && <EconomiaSection />}
      <NewsListSection category={category} />
    </main>
  );
}
