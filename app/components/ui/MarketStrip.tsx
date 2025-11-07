"use client";

import type React from "react";
import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BcraIndicator,
} from "../../types/market";

// helpers sólo para este componente
function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(value);
}

type Props = {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null;
  bcra: BcraSummary | null;
  loading: boolean;
};

export function MarketStrip({ dolar, crypto, bcra, loading }: Props) {
  const dolarItems: { key: string; label: string }[] = [
    { key: "oficial", label: "DÓLAR OFICIAL" },
    { key: "tarjeta", label: "DÓLAR TARJETA" },
    { key: "blue", label: "DÓLAR BLUE" },
    { key: "mep", label: "DÓLAR MEP" },
    { key: "ccl", label: "CONTADO CON LIQUI" },
  ];

  const cryptoItems: { key: keyof CryptoResponse; label: string }[] = [
    { key: "bitcoin", label: "Bitcoin BTC" },
    { key: "ethereum", label: "Ethereum ETH" },
    { key: "solana", label: "Solana SOL" },
    { key: "binancecoin", label: "BNB BNB" },
    { key: "tether", label: "USDT USDTARS" },
  ];

  if (loading) {
    return (
      <section style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: "#9ca3af" }}>Cargando mercado...</p>
      </section>
    );
  }

  if (!dolar && !crypto && !bcra) return null;

  const cardStyle: React.CSSProperties = {
    minWidth: 150,
    padding: "10px 14px",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  };

  return (
    <section style={{ marginBottom: 16 }}>
      {/* fila de dólares */}
      {dolar && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: crypto || bcra ? 8 : 0,
          }}
        >
          {dolarItems.map(({ key, label }) => {
            const quote = dolar[key] as
              | { compra: number; venta: number }
              | null
              | undefined;
            if (!quote) return null;

            return (
              <div key={key} style={cardStyle}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginTop: 4,
                    color: "#111827",
                  }}
                >
                  {formatArs(quote.venta)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  Compra {formatArs(quote.compra)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* fila de criptos */}
      {crypto && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: bcra ? 8 : 0,
          }}
        >
          {cryptoItems.map(({ key, label }) => {
            const item = crypto[key];
            if (!item) return null;

            const change = item.usd_24h_change;
            let changeLabel = "";
            let changeColor = "#6b7280";
            let arrow = "";

            if (typeof change === "number") {
              const rounded = Math.round(change * 100) / 100;
              arrow = rounded > 0 ? "▲" : rounded < 0 ? "▼" : "●";
              changeColor =
                rounded > 0 ? "#16a34a" : rounded < 0 ? "#b91c1c" : "#6b7280";
              changeLabel = `${rounded > 0 ? "+" : ""}${rounded.toFixed(
                2
              )}% últimas 24 hs`;
            }

            return (
              <div key={String(key)} style={cardStyle}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginTop: 4,
                    color: "#111827",
                  }}
                >
                  {formatArs(item.usd)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: changeColor,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {arrow && <span>{arrow}</span>}
                  <span>{changeLabel || "24 hs"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* fila de indicadores BCRA */}
      {bcra && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {[
            { key: "reservas", label: "Reservas internacionales" },
            {
              key: "tipoCambioMinorista",
              label: "TC minorista (prom. vendedor)",
            },
            {
              key: "tipoCambioMayorista",
              label: "TC mayorista de referencia",
            },
            { key: "tasaBadlarPrivados", label: "BADLAR bancos privados" },
            { key: "tasaTm20Privados", label: "TM20 bancos privados" },
          ].map(({ key, label }) => {
            const ind = (bcra as any)[key] as BcraIndicator | null | undefined;
            if (!ind) return null;

            let valueLabel = "-";
            if (ind.valor != null) {
              if (ind.unidad?.toLowerCase().includes("porcentaje")) {
                valueLabel = `${ind.valor.toFixed(2)} %`;
              } else if (ind.unidad?.includes("millones de USD")) {
                valueLabel = formatNumber(ind.valor) + " M USD";
              } else if (
                ind.unidad?.toLowerCase().includes("pesos argentinos")
              ) {
                valueLabel = formatArs(ind.valor);
              } else {
                valueLabel = formatNumber(ind.valor);
              }
            }

            return (
              <div key={key} style={cardStyle}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginTop: 4,
                    color: "#111827",
                  }}
                >
                  {valueLabel}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  {ind.unidad ?? ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
