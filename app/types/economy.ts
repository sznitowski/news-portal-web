// app/types/economy.ts

// -------- INDEC --------
export type IndecSeriesPoint = {
  date: string;
  value: number;
};

export type IndecSummary = {
  ipcMonthlyLast: IndecSeriesPoint | null;
  ipcYoYLast: IndecSeriesPoint | null;
  ipcAccumYear: number | null;
  unemploymentLast: IndecSeriesPoint | null;
  raw: {
    ipcMonthly: IndecSeriesPoint[] | null;
    ipcYoY: IndecSeriesPoint[] | null;
    unemployment: IndecSeriesPoint[] | null;
  };
  error: string | null;
};

// -------- SNAPSHOTS DIARIOS DÓLAR --------
export type EconomyDailySnapshot = {
  snapshot_date: string;                 // "2025-10-24"
  dolar_oficial_venta: number | string | null;

  // Si después agregás más columnas en la tabla,
  // podés ir sumándolas como opcionales:
  dolar_oficial_compra?: number | string | null;
  dolar_blue_venta?: number | string | null;
  dolar_blue_compra?: number | string | null;
};
