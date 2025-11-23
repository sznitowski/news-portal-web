// app/types/economy.ts

// ======= PANEL DIARIO (SNAPSHOTS) =======

export type EconomyDailySnapshot = {
  snapshot_date: string;                // "2025-11-23"
  dolar_oficial_venta: number | string | null;
  dolar_blue_venta: number | string | null;
  dolar_mep_venta: number | string | null;
  dolar_ccl_venta: number | string | null;
};

// ======= INDEC =======

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
