import { api } from './api'

export interface UserItem {
  _id: string
  name: string
  email: string
  role: 'LANDLORD' | 'TENANT' | 'VENDOR'
  organizationId: string
  isActive?: boolean
  phone?: string
}

export const userService = {
  fetchUsers: (params?: { role?: 'LANDLORD' | 'TENANT' | 'VENDOR' }) =>
    api.get<UserItem[]>('/users', { params }),
  getUserById: (userId: string) => api.get<UserItem>(`/users/${userId}`)
}
