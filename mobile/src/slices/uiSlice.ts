import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  isLoadingOverlayVisible: boolean
  activeModal: string | null
  toast: {
    type: 'success' | 'error' | 'info'
    message: string
  } | null
}

const initialState: UIState = {
  isLoadingOverlayVisible: false,
  activeModal: null,
  toast: null
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showLoadingOverlay: (state) => {
      state.isLoadingOverlayVisible = true
    },
    hideLoadingOverlay: (state) => {
      state.isLoadingOverlayVisible = false
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload
    },
    closeModal: (state) => {
      state.activeModal = null
    },
    showToast: (state, action: PayloadAction<{ type: 'success' | 'error' | 'info'; message: string }>) => {
      state.toast = action.payload
    },
    clearToast: (state) => {
      state.toast = null
    }
  }
})

export const {
  clearToast,
  closeModal,
  hideLoadingOverlay,
  openModal,
  showLoadingOverlay,
  showToast
} = uiSlice.actions

export default uiSlice.reducer
