// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    // en el futuro: articles, auth, etc.
  },
});

// Tipos para usar en componentes
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
