import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, RequestItem } from '../services/api'
import { RootState } from '../store'

interface RequestsState {
  items: RequestItem[]
  loading: boolean
  creating: boolean
  error: string | null
}

const initialState: RequestsState = {
  items: [],
  loading: false,
  creating: false,
  error: null
}

export const fetchRequests = createAsyncThunk(
  'requests/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<RequestItem[]>('/requests')
      return response.data
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

export const createMaintenanceRequest = createAsyncThunk(
  'requests/createMaintenanceRequest',
  async (
    payload: {
      propertyId: string
      unitId: string
      title: string
      description: string
      urgency: 'LOW' | 'MEDIUM' | 'HIGH'
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState
      const currentUser = state.auth.user

      if (!currentUser) {
        return rejectWithValue('Unauthorized')
      }

      const response = await api.post<RequestItem>('/requests', {
        ...payload,
        tenantId: currentUser._id
      })

      return response.data
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

const requestsSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    clearRequestError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to process request. Please try again.'
      })
      .addCase(createMaintenanceRequest.pending, (state) => {
        state.creating = true
        state.error = null
      })
      .addCase(createMaintenanceRequest.fulfilled, (state, action) => {
        state.creating = false
        state.items = [action.payload, ...state.items]
      })
      .addCase(createMaintenanceRequest.rejected, (state, action) => {
        state.creating = false
        state.error = (action.payload as string) || 'Unable to process request. Please try again.'
      })
  }
})

export const { clearRequestError } = requestsSlice.actions
export default requestsSlice.reducer
