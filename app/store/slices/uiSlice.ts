// store/slices/uiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  globalLoading: boolean;
  globalError: string | null;
  toastMessage: string | null;
}

const initialState: UIState = {
  globalLoading: false,
  globalError: null,
  toastMessage: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
    setGlobalError(state, action: PayloadAction<string | null>) {
      state.globalError = action.payload;
    },
    setToastMessage(state, action: PayloadAction<string | null>) {
      state.toastMessage = action.payload;
    },
  },
});

export const { setGlobalLoading, setGlobalError, setToastMessage } =
  uiSlice.actions;

export default uiSlice.reducer;
