import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { api, AuthResponse } from '../services/api'
import { getRefreshToken, removeTokens, setTokens } from '../services/authStorage'

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
  infoMessage: string | null
}

const initialState: AuthState = {
  user: null,
  loading: false,
  initializing: true,
  error: null,
  infoMessage: null
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
      const networkError = error as { message?: string; response?: { data?: { message?: string } } }
      if (!networkError.response) {
        return rejectWithValue('Cannot connect to server. Ensure backend is running and API URL is reachable.')
      }
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

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (payload: { email: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<{ message: string }>('/auth/forgot-password', payload)
      return response.data
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload: { token: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', payload)
      return response.data.message
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

export const validateInvite = createAsyncThunk(
  'auth/validateInvite',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{
        email: string
        role: 'TENANT' | 'VENDOR'
        organizationId: string
        expiresAt: string
      }>(`/invites/validate/${token}`)
      return response.data
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Invalid or expired invite token.')
    }
  }
)

export const registerFromInvite = createAsyncThunk(
  'auth/registerFromInvite',
  async (payload: { token: string; name: string; password: string; phone?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<AuthResponse>('/invites/accept', {
        token: payload.token,
        name: payload.name,
        password: payload.password,
        phone: payload.phone
      })
      await setTokens(response.data.accessToken, response.data.refreshToken)
      return response.data.user
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to process request. Please try again.')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const refreshToken = await getRefreshToken()
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken })
    }
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
    },
    clearAuthInfoMessage: (state) => {
      state.infoMessage = null
    },
    forceLogout: (state) => {
      state.user = null
      state.initializing = false
      state.loading = false
      state.error = null
      state.infoMessage = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
        state.infoMessage = null
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
        state.infoMessage = null
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to process request. Please try again.'
      })
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.infoMessage = null
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false
        state.infoMessage = action.payload.message
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to process request. Please try again.'
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.infoMessage = null
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false
        state.infoMessage = action.payload
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to process request. Please try again.'
      })
      .addCase(validateInvite.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(validateInvite.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(validateInvite.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Invalid or expired invite token.'
      })
      .addCase(registerFromInvite.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerFromInvite.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(registerFromInvite.rejected, (state, action) => {
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

export const { clearAuthError, clearAuthInfoMessage, forceLogout } = authSlice.actions
export default authSlice.reducer
