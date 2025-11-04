// components/SiteHeader.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const NAV_ITEMS = [
  { key: "all", label: "Todas" },
  { key: "politica", label: "Política" },
  { key: "economia", label: "Economía" },
  { key: "internacional", label: "Internacional" },
];

export default function SiteHeader() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "all";

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  return (
    <header className="border-b border-neutral-800 bg-black text-white">
      {/* Franja superior con fecha + tagline */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 text-[11px] text-neutral-400">
        <span className="capitalize">{today}</span>
        <span className="hidden sm:inline text-right">
          Últimas publicaciones (scrapeadas → limpiadas → etiquetadas "RIGHT")
        </span>
      </div>

      {/* Nombre del sitio, estilo diario */}
      <div className="mx-auto max-w-5xl px-4 pb-3 pt-4 text-center">
        <Link href="/">
          <span className="cursor-pointer font-serif text-3xl sm:text-4xl tracking-wide">
            Mi Portal de Noticias
          </span>
        </Link>
      </div>

      {/* Nav de secciones */}
      <nav className="border-t border-neutral-800">
        <div className="mx-auto max-w-5xl px-4">
          <ul className="flex items-center justify-center gap-4 py-2 text-sm">
            {NAV_ITEMS.map((item) => {
              const isActive = currentCategory === item.key;

              const href =
                item.key === "all"
                  ? "/"
                  : { pathname: "/", query: { category: item.key } };

              return (
                <li key={item.key}>
                  <Link
                    href={href}
                    className={[
                      "pb-1 border-b-2 transition-colors",
                      isActive
                        ? "border-white text-white"
                        : "border-transparent text-neutral-300 hover:border-neutral-500 hover:text-white",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}
