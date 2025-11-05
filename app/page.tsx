// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildApiUrl } from "./lib/api";

// Tipo que viene de GET /articles
type ArticleSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  ideology: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

// Tipos para mercado (dólar)
type DolarQuote = {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
};

type DolarResponse = {
  oficial?: DolarQuote | null;
  blue?: DolarQuote | null;
  tarjeta?: DolarQuote | null;
  mep?: DolarQuote | null;
  ccl?: DolarQuote | null;
  raw?: DolarQuote[] | null;
  error?: string | null;
  [key: string]: DolarQuote | null | DolarQuote[] | string | undefined;
};

// Tipos para mercado (cripto)
type CryptoQuote = {
  usd: number;
  usd_24h_change?: number;
};

type CryptoResponse = {
  bitcoin?: CryptoQuote;
  ethereum?: CryptoQuote;
  solana?: CryptoQuote;
  binancecoin?: CryptoQuote;
  tether?: CryptoQuote;
  [key: string]: CryptoQuote | undefined;
};

// Tipos para BCRA
type BcraIndicator = {
  id: number;
  descripcion: string;
  unidad: string | null;
  moneda: string | null;
  fecha: string | null;
  valor: number | null;
};

type BcraSummary = {
  reservas: BcraIndicator | null;
  tipoCambioMinorista: BcraIndicator | null;
  tipoCambioMayorista: BcraIndicator | null;
  tasaBadlarPrivados: BcraIndicator | null;
  tasaTm20Privados: BcraIndicator | null;
};

const PAGE_SIZE = 10;

// helper simple para formatear moneda ARS
function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

// helper genérico para números
function formatNumber(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function HomePage() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");

  // estado de mercado
  const [dolarData, setDolarData] = useState<DolarResponse | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoResponse | null>(null);
  const [bcraData, setBcraData] = useState<BcraSummary | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;

  // reset de lista cuando cambia la categoría
  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
  }, [category]);

  // carga de artículos (paginado simple)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const isFirstPage = page === 1 && articles.length === 0;

      if (isFirstPage) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("limit", PAGE_SIZE.toString());
        params.set("page", page.toString());
        if (category) params.set("category", category);

        const url = buildApiUrl("/articles", params);
        const res = await fetch(url, { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`failed to fetch /articles (status ${res.status})`);
        }

        const data: ArticleSummary[] = await res.json();

        if (cancelled) return;

        if (page === 1) {
          setArticles(data);
        } else {
          setArticles((prev) => [...prev, ...data]);
        }

        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("error fetching /articles", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsLoadingMore(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [category, page, articles.length]);

  // carga de datos de mercado (dólar + cripto + BCRA)
  useEffect(() => {
    let cancelled = false;

    function loadMarket() {
      setMarketLoading(true);

      // DÓLAR
      fetch(buildApiUrl("/market/dolar"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (cancelled || !json) return;
          setDolarData(json);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("error fetching /market/dolar", err);
        });

      // CRIPTOS
      fetch(buildApiUrl("/market/crypto"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (cancelled || !json) return;
          setCryptoData(json);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("error fetching /market/crypto", err);
        })
        .finally(() => {
          if (!cancelled) setMarketLoading(false);
        });

      // BCRA (reservas, tasas, etc.)
      fetch(buildApiUrl("/market/bcra"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (cancelled || !json) return;
          setBcraData(json);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("error fetching /market/bcra", err);
        });
    }

    loadMarket();

    return () => {
      cancelled = true;
    };
  }, []);

  // búsqueda por título
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter((a) => a.title.toLowerCase().includes(q));
  }, [articles, search]);

  // titulares rápidos (top 4 últimos)
  const quickHeadlines = articles.slice(0, 4);

  const today = new Date();
  const todayLabel = today.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading && articles.length === 0) {
    return (
      <main style={{ padding: 24 }}>
        <p style={{ color: "#6b7280" }}>Cargando...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Tira de mercado (dólar + cripto + BCRA) */}
      <MarketStrip
        dolar={dolarData}
        crypto={cryptoData}
        bcra={bcraData}
        loading={marketLoading}
      />

      {/* Banda negra con título + fecha / descripción */}
      <section
        style={{
          marginBottom: 24,
          marginTop: 8,
          backgroundColor: "#000",
          color: "#fff",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            Últimas noticias
          </h1>

          <div
            style={{
              textAlign: "right",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 500 }}>
              {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}
            </div>
            <div style={{ opacity: 0.9 }}>
              Últimas publicaciones (scrapeadas → limpiadas → etiquetadas
              &nbsp;&quot;RIGHT&quot;)
            </div>
          </div>
        </div>
      </section>

      {/* Buscador */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título..."
          style={{
            width: "100%",
            maxWidth: 540,
            padding: "10px 16px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
      </div>

      {/* Layout principal: lista + sidebar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        {/* Lista de artículos */}
        <section>
          {articles.length === 0 && (
            <p style={{ color: "#9ca3af" }}>No hay artículos publicados.</p>
          )}

          {articles.length > 0 && filteredArticles.length === 0 && (
            <p style={{ color: "#9ca3af" }}>
              No hay artículos que coincidan con la búsqueda.
            </p>
          )}

          <ul
            style={{
              display: "grid",
              gap: 24,
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {filteredArticles.map((a) => (
              <li
                key={a.id}
                style={{
                  borderRadius: 12,
                  padding: 24,
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span>{a.category}</span>
                  <span>·</span>
                  <span>
                    {new Date(a.publishedAt).toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                  <span>·</span>
                  <span style={{ fontWeight: 600 }}>( {a.ideology} )</span>
                </div>

                <Link
                  href={`/article/${a.slug}`}
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#111827",
                    textDecoration: "none",
                  }}
                >
                  {a.title}
                </Link>

                {a.summary ? (
                  <p
                    style={{
                      color: "#4b5563",
                      fontSize: 14,
                      marginTop: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {a.summary}
                  </p>
                ) : (
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      marginTop: 8,
                      fontStyle: "italic",
                    }}
                  >
                    (sin resumen)
                  </p>
                )}
              </li>
            ))}
          </ul>

          {/* Paginación "Cargar más" */}
          {articles.length > 0 && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoadingMore) {
                      setPage((p) => p + 1);
                    }
                  }}
                  disabled={isLoadingMore}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#111827",
                    color: "#fff",
                    cursor: isLoadingMore ? "default" : "pointer",
                    opacity: isLoadingMore ? 0.6 : 1,
                  }}
                >
                  {isLoadingMore ? "Cargando..." : "Cargar más"}
                </button>
              ) : (
                <p style={{ color: "#6b7280", fontSize: 14 }}>
                  No hay más resultados.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Sidebar de titulares rápidos (sticky) */}
        <aside
          style={{
            alignSelf: "flex-start",
            position: "sticky",
            top: 120,
          }}
        >
          <section
            style={{
              borderRadius: 12,
              padding: 16,
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Titulares rápidos
            </h2>

            {quickHeadlines.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>
                Todavía no hay artículos para mostrar aquí.
              </p>
            ) : (
              <ol
                style={{
                  listStyle: "decimal",
                  paddingLeft: 20,
                  margin: 0,
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                  color: "#111827",
                }}
              >
                {quickHeadlines.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/article/${a.slug}`}
                      style={{
                        textDecoration: "none",
                        color: "#111827",
                      }}
                    >
                      {a.title}
                    </Link>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                      }}
                    >
                      {new Date(a.publishedAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

// --- componente de tira de mercado ---

function MarketStrip({
  dolar,
  crypto,
  bcra,
  loading,
}: {
  dolar: DolarResponse | null;
  crypto: CryptoResponse | null;
  bcra: BcraSummary | null;
  loading: boolean;
}) {
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
            const quote = dolar[key] as DolarQuote | null | undefined;
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
                valueLabel =
                  formatNumber(ind.valor) + " M USD";
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
