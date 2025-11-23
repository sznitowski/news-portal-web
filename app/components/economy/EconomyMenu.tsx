// app/components/economy/EconomyMenu.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  isActive: boolean;
};

export default function EconomyMenu({ isActive }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", "economia");
    params.delete("view"); // siempre arrancamos en Resumen
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
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
  );
}
