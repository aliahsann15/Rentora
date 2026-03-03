import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserItem, userService } from '../services/userService'

interface UserState {
  users: UserItem[]
  selectedUser: UserItem | null
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null
}

export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (role: 'LANDLORD' | 'TENANT' | 'VENDOR' | undefined, { rejectWithValue }) => {
    try {
      const response = await userService.fetchUsers(role ? { role } : undefined)
      return response.data
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      return rejectWithValue(message || 'Unable to fetch users')
    }
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<UserItem | null>) => {
      state.selectedUser = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<UserItem[]>) => {
        state.loading = false
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Unable to fetch users'
      })
  }
})

export const { setSelectedUser } = userSlice.actions
export default userSlice.reducer
