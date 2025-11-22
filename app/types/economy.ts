// app/types/economy.ts

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
