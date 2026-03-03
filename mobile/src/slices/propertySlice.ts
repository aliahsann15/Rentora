import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PropertyItem, propertyService } from '../services/propertyService'

interface PropertyState {
  properties: PropertyItem[]
  selectedProperty: PropertyItem | null
  loading: boolean
  error: string | null
}

const initialState: PropertyState = {
  properties: [],
  selectedProperty: null,
  loading: false,
  error: null
}

export const fetchProperties = createAsyncThunk('property/fetchProperties', async (_, { rejectWithValue }) => {
  try {
    const response = await propertyService.fetchProperties()
    return response.data
  } catch (error: unknown) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    return rejectWithValue(message || 'Unable to fetch properties')
  }
})

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setSelectedProperty: (state, action: PayloadAction<PropertyItem | null>) => {
      state.selectedProperty = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProperties.fulfilled, (state, action: PayloadAction<PropertyItem[]>) => {
        state.loading = false
        state.properties = action.payload
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to fetch properties'
      })
  }
})

export const { setSelectedProperty } = propertySlice.actions
export default propertySlice.reducer
