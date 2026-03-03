import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { api, AuthResponse } from '../services/api'
import { removeTokens, setTokens } from '../services/authStorage'

interface AuthUser {
  _id: string
  name: string
  email: string
  role: 'LANDLORD' | 'TENANT' | 'VENDOR'
  organizationId: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initializing: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  loading: false,
  initializing: true,
  error: null
}

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', payload)
      await setTokens(response.data.accessToken, response.data.refreshToken)
      return response.data.user
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (
    payload: {
      name: string
      email: string
      password: string
      organizationName: string
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', payload)
      await setTokens(response.data.accessToken, response.data.refreshToken)
      return response.data.user
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

export const bootstrapSession = createAsyncThunk(
  'auth/bootstrapSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ user: AuthUser }>('/auth/me')
      return response.data.user
    } catch {
      await removeTokens()
      return rejectWithValue('Session expired')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout', {})
    await removeTokens()
  } catch {
    await removeTokens()
    return rejectWithValue('Unable to process request. Please try again.')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to process request. Please try again.'
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to process request. Please try again.'
      })
      .addCase(bootstrapSession.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.initializing = false
        state.user = action.payload
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.initializing = false
        state.user = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
      })
      .addCase(logout.rejected, (state) => {
        state.user = null
      })
  }
})

export const { clearAuthError } = authSlice.actions
export default authSlice.reducer
