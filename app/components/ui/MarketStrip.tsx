// app/components/ui/MarketStrip.tsx
"use client";

import type React from "react";
import type {
  DolarResponse,
  CryptoResponse,
  BcraSummary,
  BudgetSummary,
} from "../../types/market";

type Props = {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null;
  bcra: BcraSummary | null;
  countryRisk: number | null;
  budget: BudgetSummary | null;
  loading: boolean;

  // flags opcionales para controlar qué se muestra
  showHeader?: boolean;
  showDolar?: boolean;
  showCrypto?: boolean;
  showBcra?: boolean;
  showBudget?: boolean;
};

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

// para mostrar montos en millones: "12.345 M ARS"
function formatMillionsArs(m: number | null | undefined) {
  if (m == null) return "-";
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    m,
  )} M ARS`;
}

const MarketStrip: React.FC<Props> = (props) => {
  const {
    dolar,
    crypto,
    bcra,
    countryRisk,
    budget,
    loading,
    showHeader = true,
    showDolar = true,
    showCrypto = true,
    showBcra = true,
    showBudget = true,
  } = props;

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

  const hasDolar = !!dolar;
  const hasCrypto = !!crypto;
  const hasBcra = !!bcra;
  const hasRisk = countryRisk != null;
  const hasBudget = !!budget;

  const nothingVisible =
    (!hasDolar || !showDolar) &&
    (!hasCrypto || !showCrypto) &&
    (!hasBcra || !showBcra) &&
    (!hasRisk || !showBcra) &&
    (!hasBudget || !showBudget);

  if (loading) {
    return (
      <section style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: "#9ca3af" }}>Cargando mercado...</p>
      </section>
    );
  }

  if (nothingVisible) {
    return null;
  }

  const cardStyle: React.CSSProperties = {
    minWidth: 150,
    padding: "10px 14px",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#4b5563",
  };

  const sectionSubtitleStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#9ca3af",
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <div
        style={{
          borderRadius: 16,
          padding: 18,
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 15px -5px rgba(0,0,0,0.06)",
        }}
      >
        {/* cabecera (sin el texto "Panorama económico" si showHeader=false) */}
        {showHeader && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 12,
              alignItems: "baseline",
            }}
          >
            <div>
              <p style={{ marginTop: 0, fontSize: 11, color: "#6b7280" }}>
                Cotizaciones y tasas de referencia en Argentina.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: "grid", rowGap: 18 }}>
          {/* DÓLAR */}
          {hasDolar && showDolar && (
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={sectionTitleStyle}>Mercado cambiario</div>
                <div style={sectionSubtitleStyle}>
                  Dólar oficial, tarjeta, blue, MEP y CCL.
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {dolarItems.map(({ key, label }) => {
                  const quote = (dolar as any)[key];
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
                        style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}
                      >
                        Compra {formatArs(quote.compra)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CRIPTOS */}
          {hasCrypto && showCrypto && (
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={sectionTitleStyle}>Criptomonedas</div>
                <div style={sectionSubtitleStyle}>
                  Precios en pesos tomando como base la cotización en dólares.
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
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
                      2,
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
            </div>
          )}

          {/* BCRA + RIESGO */}
          {showBcra && (hasBcra || hasRisk) && (
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={sectionTitleStyle}>
                  Indicadores BCRA &amp; riesgo país
                </div>
                <div style={sectionSubtitleStyle}>
                  Reservas, tipos de cambio de referencia, tasas y EMBI+
                  Argentina.
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {bcra &&
                  [
                    { key: "reservas", label: "Reservas internacionales" },
                    {
                      key: "tipoCambioMinorista",
                      label: "TC minorista (prom. vendedor)",
                    },
                    {
                      key: "tipoCambioMayorista",
                      label: "TC mayorista de referencia",
                    },
                    {
                      key: "tasaBadlarPrivados",
                      label: "BADLAR bancos privados",
                    },
                    {
                      key: "tasaTm20Privados",
                      label: "TM20 bancos privados",
                    },
                  ].map(({ key, label }) => {
                    const ind = (bcra as any)[key];
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

                {hasRisk && (
                  <div style={cardStyle}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      RIESGO PAÍS (ARG)
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginTop: 4,
                        color: "#111827",
                      }}
                    >
                      {formatNumber(countryRisk)} pts
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        marginTop: 2,
                      }}
                    >
                      EMBI+ en puntos básicos
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRESUPUESTO NACIONAL */}
          {hasBudget && showBudget && (
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={sectionTitleStyle}>Presupuesto nacional</div>
                <div style={sectionSubtitleStyle}>
                  Totales acumulados del ejercicio{" "}
                  {budget?.year ?? "-"} (en millones de pesos).
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {/* Recursos percibidos */}
                <div style={cardStyle}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Recursos percibidos
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginTop: 4,
                      color: "#111827",
                    }}
                  >
                    {formatMillionsArs(budget?.totalRevenue ?? null)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 2,
                    }}
                  >
                    Recaudación acumulada
                  </div>
                </div>

                {/* Gasto primario devengado */}
                <div style={cardStyle}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Gasto primario devengado
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginTop: 4,
                      color: "#111827",
                    }}
                  >
                    {formatMillionsArs(budget?.totalSpending ?? null)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 2,
                    }}
                  >
                    Acumulado del período
                  </div>
                </div>

                {/* Resultado primario */}
                <div style={cardStyle}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Resultado primario
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginTop: 4,
                      color:
                        (budget?.primaryBalance ?? 0) > 0
                          ? "#16a34a"
                          : (budget?.primaryBalance ?? 0) < 0
                          ? "#b91c1c"
                          : "#111827",
                    }}
                  >
                    {formatMillionsArs(budget?.primaryBalance ?? null)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 2,
                    }}
                  >
                    Ingresos − Gastos (primarios)
                  </div>
                </div>
              </div>

              {budget?.raw?.total?.ultima_actualizacion_fecha && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  Última actualización:{" "}
                  {budget.raw.total.ultima_actualizacion_fecha}
                </div>
              )}
              {budget?.error && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "#b91c1c",
                  }}
                >
                  {budget.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MarketStrip;
