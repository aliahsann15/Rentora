import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RequestItem } from '../services/api'
import { requestService } from '../services/requestService'

interface RequestThunkState {
  auth: {
    user: {
      _id: string
    } | null
  }
}

interface RequestSliceState {
  items: RequestItem[]
  requests: RequestItem[]
  selectedRequest: RequestItem | null
  loading: boolean
  creating: boolean
  error: string | null
  filters: {
    status: string
    propertyId: string
  }
}

const initialState: RequestSliceState = {
  items: [],
  requests: [],
  selectedRequest: null,
  loading: false,
  creating: false,
  error: null,
  filters: {
    status: '',
    propertyId: ''
  }
}

export const fetchRequests = createAsyncThunk(
  'request/fetchRequests',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { request: RequestSliceState }
      const { status, propertyId } = state.request.filters
      const response = await requestService.fetchRequests({
        status: status || undefined,
        propertyId: propertyId || undefined
      })
      return response.data
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

export const createRequest = createAsyncThunk(
  'request/createRequest',
  async (
    payload: {
      propertyId: string
      unitId: string
      title: string
      description: string
      urgency: 'LOW' | 'MEDIUM' | 'HIGH'
      images?: string[]
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RequestThunkState
      const currentUser = state.auth.user

      if (!currentUser) {
        return rejectWithValue('Unauthorized')
      }

      const response = await requestService.createRequest({
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

export const assignVendor = createAsyncThunk(
  'request/assignVendor',
  async (payload: { requestId: string; vendorId: string }, { rejectWithValue }) => {
    try {
      const response = await requestService.assignVendor(payload)
      return response.data
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

export const updateStatus = createAsyncThunk(
  'request/updateStatus',
  async (
    payload: { requestId: string; status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED' },
    { rejectWithValue }
  ) => {
    try {
      const response = await requestService.updateStatus(payload)
      return response.data
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

const requestSlice = createSlice({
  name: 'request',
  initialState,
  reducers: {
    setSelectedRequest: (state, action: PayloadAction<RequestItem | null>) => {
      state.selectedRequest = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<RequestSliceState['filters']>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
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
      .addCase(fetchRequests.fulfilled, (state, action: PayloadAction<RequestItem[]>) => {
        state.loading = false
        state.items = action.payload
        state.requests = action.payload
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to process request. Please try again.'
      })
      .addCase(createRequest.pending, (state) => {
        state.creating = true
        state.error = null
      })
      .addCase(createRequest.fulfilled, (state, action: PayloadAction<RequestItem>) => {
        state.creating = false
        state.items = [action.payload, ...state.items]
        state.requests = [action.payload, ...state.requests]
        state.selectedRequest = action.payload
      })
      .addCase(createRequest.rejected, (state, action) => {
        state.creating = false
        state.error = (action.payload as string) || 'Unable to process request. Please try again.'
      })
      .addCase(assignVendor.fulfilled, (state, action: PayloadAction<RequestItem>) => {
        state.items = state.items.map((request) =>
          request._id === action.payload._id ? action.payload : request
        )
        state.requests = state.requests.map((request) =>
          request._id === action.payload._id ? action.payload : request
        )
        if (state.selectedRequest?._id === action.payload._id) {
          state.selectedRequest = action.payload
        }
      })
      .addCase(updateStatus.fulfilled, (state, action: PayloadAction<RequestItem>) => {
        state.items = state.items.map((request) =>
          request._id === action.payload._id ? action.payload : request
        )
        state.requests = state.requests.map((request) =>
          request._id === action.payload._id ? action.payload : request
        )
        if (state.selectedRequest?._id === action.payload._id) {
          state.selectedRequest = action.payload
        }
      })
  }
})

export const {
  clearFilters,
  clearRequestError,
  setFilters,
  setSelectedRequest
} = requestSlice.actions

export default requestSlice.reducer
