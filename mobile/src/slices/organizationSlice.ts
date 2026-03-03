import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface OrganizationState {
  organizationId: string | null
  organizationName: string | null
  loading: boolean
  error: string | null
}

const initialState: OrganizationState = {
  organizationId: null,
  organizationName: null,
  loading: false,
  error: null
}

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setOrganization: (
      state,
      action: PayloadAction<{ organizationId: string; organizationName?: string | null }>
    ) => {
      state.organizationId = action.payload.organizationId
      state.organizationName = action.payload.organizationName || null
    },
    clearOrganization: (state) => {
      state.organizationId = null
      state.organizationName = null
      state.error = null
    }
  }
})

export const { setOrganization, clearOrganization } = organizationSlice.actions
export default organizationSlice.reducer
