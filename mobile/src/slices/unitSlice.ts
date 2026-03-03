import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../services/api'

interface UnitItem {
  _id: string
  propertyId: string
  unitNumber: string
  floor?: string
  beds?: number
  baths?: number
  areaSqFt?: number
}

interface UnitState {
  units: UnitItem[]
  selectedUnit: UnitItem | null
  loading: boolean
  error: string | null
}

const initialState: UnitState = {
  units: [],
  selectedUnit: null,
  loading: false,
  error: null
}

export const fetchUnits = createAsyncThunk(
  'unit/fetchUnits',
  async (propertyId: string | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get<UnitItem[]>('/units', {
        params: propertyId ? { propertyId } : undefined
      })
      return response.data
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to fetch units')
    }
  }
)

const unitSlice = createSlice({
  name: 'unit',
  initialState,
  reducers: {
    setSelectedUnit: (state, action: PayloadAction<UnitItem | null>) => {
      state.selectedUnit = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnits.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUnits.fulfilled, (state, action: PayloadAction<UnitItem[]>) => {
        state.loading = false
        state.units = action.payload
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to fetch units'
      })
  }
})

export const { setSelectedUnit } = unitSlice.actions
export default unitSlice.reducer
