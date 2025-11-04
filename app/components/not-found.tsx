// components/not-found.tsx
"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

const wrapperStyle: CSSProperties = {
  minHeight: "calc(100vh - 120px)", // deja espacio para el header
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 16px",
};

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 24,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const codeStyle: CSSProperties = {
  fontSize: 48,
  fontWeight: 700,
  letterSpacing: "0.18em",
};

const dividerStyle: CSSProperties = {
  width: 1,
  height: 48,
  backgroundColor: "#d1d5db",
};

const textStyle: CSSProperties = {
  fontSize: 18,
  color: "#4b5563",
};

export default function NotFoundView() {
  return (
    <main style={wrapperStyle}>
      <div style={cardStyle}>
        <div style={rowStyle}>
          <span style={codeStyle}>404</span>
          <span style={dividerStyle} />
          <p style={textStyle}>Esta página no pudo encontrarse.</p>
        </div>

        <Link
          href="/"
          style={{
            fontSize: 14,
            color: "#1d4ed8",
            textDecoration: "none",
          }}
        >
          ← Volver a la portada
        </Link>
      </div>
    </main>
  );
}
