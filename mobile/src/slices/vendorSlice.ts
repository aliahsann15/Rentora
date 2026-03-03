import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { VendorItem, vendorService } from '../services/vendorService'

interface VendorState {
  vendors: VendorItem[]
  selectedVendor: VendorItem | null
  loading: boolean
  error: string | null
}

const initialState: VendorState = {
  vendors: [],
  selectedVendor: null,
  loading: false,
  error: null
}

export const fetchVendors = createAsyncThunk('vendor/fetchVendors', async (_, { rejectWithValue }) => {
  try {
    const response = await vendorService.fetchVendors()
    return response.data
  } catch (error: unknown) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    return rejectWithValue(message || 'Unable to fetch vendors')
  }
})

const vendorSlice = createSlice({
  name: 'vendor',
  initialState,
  reducers: {
    setSelectedVendor: (state, action: PayloadAction<VendorItem | null>) => {
      state.selectedVendor = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVendors.fulfilled, (state, action: PayloadAction<VendorItem[]>) => {
        state.loading = false
        state.vendors = action.payload
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to fetch vendors'
      })
  }
})

export const { setSelectedVendor } = vendorSlice.actions
export default vendorSlice.reducer
