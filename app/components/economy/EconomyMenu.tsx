"use client";

import { useEffect, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";


type Props = {
  isActive: boolean;
};

type EconomyOption = {
  key: string;
  label: string;
  href: string;
};

const OPTIONS: EconomyOption[] = [
  {
    key: "summary",
    label: "Resumen de Economía",
    href: "/?category=economia",
  },
  {
    key: "market",
    label: "Dólar y Criptomonedas",
    href: "/?category=economia&view=market",
  },
  {
    key: "bcra",
    label: "Indicadores BCRA",
    href: "/?category=economia&view=bcra",
  },
  {
    key: "budget",
    label: "Presupuesto / Déficit",
    href: "/?category=economia&view=budget",
  },
];

export default function EconomyMenu({ isActive }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  // Cerrar dropdown cuando cambia la ruta o los query params
  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams?.toString()]);

  // CLICK en el botón principal "Economía"
  const handleMainClick = () => {
    // Si NO estamos en economía, navegamos
    if (!isActive) {
      router.push("/?category=economia");
      setOpen(false);
      return;
    }

    // Si ya estamos en economía, sólo togglear el menú
    setOpen((prev) => !prev);
  };

  const handleOptionClick = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleMainClick}
        style={{
          position: "relative",
          paddingBottom: 6,
          fontSize: 15,
          fontWeight: isActive ? 600 : 500,
          color: isActive ? "#020617" : "#6b7280",
          textDecoration: "none",
          whiteSpace: "nowrap",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>Economía</span>
        <span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>

        {isActive && (
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 3,
              borderRadius: 999,
              background:
                "linear-gradient(90deg,#38bdf8,#6366f1,#a855f7)",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: 260,
            backgroundColor: "#020617",
            color: "#e5e7eb",
            borderRadius: 16,
            padding: 12,
            boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
            zIndex: 50,
          }}
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleOptionClick(opt.href)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: "#e5e7eb",
                fontSize: 13,
                cursor: "pointer",
                marginBottom: 4,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
