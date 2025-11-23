// app/sections/economy/EconomyViewTabs.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { id: "summary", label: "Resumen de Economía" },
  { id: "dolar-cripto", label: "Dólar y Criptomonedas" },
  { id: "bcra", label: "Indicadores BCRA" },
  { id: "presupuesto", label: "Presupuesto / Déficit" },
];

function getCurrentView(viewParam: string | null): string {
  if (viewParam === "dolar-cripto") return "dolar-cripto";
  if (viewParam === "bcra") return "bcra";
  if (viewParam === "presupuesto") return "presupuesto";
  return "summary"; // default
}

export default function EconomyViewTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = (searchParams.get("category") || "").toLowerCase();

  // Sólo mostramos el submenu cuando estamos en Economía
  if (category !== "economia") return null;

  const currentView = getCurrentView(searchParams.get("view"));

  const handleClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("category", "economia");

    if (id === "summary") {
      // resumen = sin view en la URL
      params.delete("view");
    } else {
      params.set("view", id);
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const activeColor = "#020617"; // mismo que el menú superior
  const inactiveColor = "#6b7280";

  return (
    <div className="border-b border-slate-200 bg-white/95">
      <div className="mx-auto max-w-5xl px-4">
        <nav
          aria-label="Subsecciones de economía"
          className="flex w-full justify-center gap-10 overflow-x-auto py-3 text-[15px]"
        >
          {TABS.map((tab) => {
            const active = currentView === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleClick(tab.id)}
                className={
                  "relative pb-3 font-medium leading-none outline-none transition-colors cursor-pointer"
                }
                style={{
                  color: active ? activeColor : inactiveColor,
                }}
              >
                {tab.label}

                {/* subrayado con gradiente como el menú de arriba */}
                <span
                  className={
                    "pointer-events-none absolute left-0 right-0 bottom-0 h-[3px] rounded-full transition-opacity " +
                    (active
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-60")
                  }
                  style={{
                    background:
                      "linear-gradient(90deg,#38bdf8,#6366f1,#a855f7)",
                  }}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
