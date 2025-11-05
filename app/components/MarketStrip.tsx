"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "../lib/api";

type DolarQuote = {
    moneda: string;
    casa: string;
    nombre: string;
    compra: number | null;
    venta: number | null;
    fechaActualizacion: string;
};

type DolarResponse = {
    oficial: DolarQuote | null;
    blue: DolarQuote | null;
    raw: DolarQuote[] | null;
    error: string | null;
};

type CryptoResponse = {
    bitcoin?: { usd: number; usd_24h_change?: number };
    ethereum?: { usd: number; usd_24h_change?: number };
    solana?: { usd: number; usd_24h_change?: number };
    binancecoin?: { usd: number; usd_24h_change?: number };
    tether?: { usd: number; usd_24h_change?: number };
};

const arsFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
});

function formatArs(value: number | null | undefined) {
    if (value == null) return "-";
    return arsFormatter.format(value);
}

export default function MarketStrip() {
    const [dolar, setDolar] = useState<DolarResponse | null>(null);
    const [crypto, setCrypto] = useState<CryptoResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);

                const [dolarRes, cryptoRes] = await Promise.all([
                    fetch(buildApiUrl("/market/dolar"), { cache: "no-store" }),
                    fetch(buildApiUrl("/market/crypto"), { cache: "no-store" }),
                ]);

                const dolarJson: DolarResponse = await dolarRes.json();
                const cryptoJson: CryptoResponse = await cryptoRes.json();

                if (cancelled) return;

                setDolar(dolarJson);
                setCrypto(cryptoJson);
            } catch (err) {
                console.error("error fetching market data", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    // Conversión simple USD → ARS usando el dólar oficial (si está disponible)
    const dolarOficialVenta = dolar?.oficial?.venta ?? null;
    const btcArs =
        dolarOficialVenta && crypto?.bitcoin
            ? crypto.bitcoin.usd * dolarOficialVenta
            : null;
    const ethArs =
        dolarOficialVenta && crypto?.ethereum
            ? crypto.ethereum.usd * dolarOficialVenta
            : null;

    if (loading) {
        return (
            <section
                style={{
                    marginBottom: 24,
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        padding: "16px 20px",
                        borderRadius: 12,
                        backgroundColor: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                        minWidth: 180,
                    }}
                >
                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                        Cargando cotizaciones...
                    </span>
                </div>
            </section>
        );
    }

    return (
        <section
            style={{
                marginBottom: 24,
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
            }}
        >
            {/* DÓLAR OFICIAL */}
            {dolar?.oficial && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderRadius: 12,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        minWidth: 180,
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: "#6b7280",
                            marginBottom: 8,
                        }}
                    >
                        Dólar oficial
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            marginBottom: 4,
                        }}
                    >
                        {formatArs(dolar.oficial.venta)}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Compra {formatArs(dolar.oficial.compra)}
                    </div>
                </div>
            )}

            {/* DÓLAR BLUE */}
            {dolar?.blue && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderRadius: 12,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        minWidth: 180,
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: "#6b7280",
                            marginBottom: 8,
                        }}
                    >
                        Dólar blue
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            marginBottom: 4,
                        }}
                    >
                        {formatArs(dolar.blue.venta)}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Compra {formatArs(dolar.blue.compra)}
                    </div>
                </div>
            )}

            {/* BITCOIN */}
            {crypto?.bitcoin && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderRadius: 12,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        minWidth: 200,
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: "#6b7280",
                            marginBottom: 8,
                        }}
                    >
                        Bitcoin BTC
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            marginBottom: 4,
                        }}
                    >
                        {btcArs != null
                            ? formatArs(btcArs)
                            : usdFormatter.format(crypto.bitcoin.usd)}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Precio en ARS (aprox.)
                    </div>
                </div>
            )}

            {/* ETHEREUM */}
            {crypto?.ethereum && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderRadius: 12,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        minWidth: 200,
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: "#6b7280",
                            marginBottom: 8,
                        }}
                    >
                        Ethereum ETH
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            marginBottom: 4,
                        }}
                    >
                        {ethArs != null
                            ? formatArs(ethArs)
                            : usdFormatter.format(crypto.ethereum.usd)}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Precio en ARS (aprox.)
                    </div>
                </div>
            )}

            {/* Si hubiera algún error en DolarAPI */}
            {dolar?.error && !dolar.oficial && !dolar.blue && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderRadius: 12,
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        minWidth: 200,
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: "#b91c1c",
                            marginBottom: 4,
                        }}
                    >
                        Error dólar
                    </div>
                    <div style={{ fontSize: 13, color: "#b91c1c" }}>{dolar.error}</div>
                </div>
            )}
        </section>
    );
}
