// app/types/market.ts

// --- Dólar ---
export type DolarQuote = {
    moneda: string;
    casa: string;
    nombre: string;
    compra: number;
    venta: number;
    fechaActualizacion: string;
};

export type DolarResponse = {
    oficial?: DolarQuote | null;
    blue?: DolarQuote | null;
    tarjeta?: DolarQuote | null;
    mep?: DolarQuote | null;
    ccl?: DolarQuote | null;
    raw?: DolarQuote[] | null;
    error?: string | null;
    [key: string]: DolarQuote | null | DolarQuote[] | string | undefined;
};

// --- Cripto ---
export type CryptoQuote = {
    usd: number;
    usd_24h_change?: number;
};

export type CryptoResponse = {
    bitcoin?: CryptoQuote;
    ethereum?: CryptoQuote;
    solana?: CryptoQuote;
    binancecoin?: CryptoQuote;
    tether?: CryptoQuote;
    [key: string]: CryptoQuote | undefined;
};

// --- BCRA ---
export type BcraIndicator = {
    id: number;
    descripcion: string;
    unidad: string | null;
    moneda: string | null;
    fecha: string | null;
    valor: number | null;
};

export type BcraSummary = {
    reservas: BcraIndicator | null;
    tipoCambioMinorista: BcraIndicator | null;
    tipoCambioMayorista: BcraIndicator | null;
    tasaBadlarPrivados: BcraIndicator | null;
    tasaTm20Privados: BcraIndicator | null;
};

// --- Presupuesto nacional (economy/budget) ---
export type BudgetSummary = {
    year: number | null;
    totalSpending: number | null;   // millones ARS (gasto primario devengado)
    totalRevenue: number | null;    // millones ARS (recursos percibidos)
    primaryBalance: number | null;  // millones ARS
    financialBalance: number | null | undefined;
    raw?: {
        total?: {
            ultima_actualizacion_fecha?: string | null;
            [key: string]: any;
        } | null;
        byFunction?: any;
    } | null;
    error?: string | null;
};
