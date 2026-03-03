import { api, AuthResponse } from './api'

export interface InviteValidationResponse {
  email: string
  role: 'TENANT' | 'VENDOR'
  organizationId: string
  expiresAt: string
}

export const authService = {
  login: (payload: { email: string; password: string }) => api.post<AuthResponse>('/auth/login', payload),
  register: (payload: { name: string; email: string; password: string; organizationName: string }) =>
    api.post<AuthResponse>('/auth/register', payload),
  me: () => api.get<{ user: AuthResponse['user'] }>('/auth/me'),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  forgotPassword: (payload: { email: string }) =>
    api.post<{ message: string; resetToken?: string }>('/auth/forgot-password', payload),
  resetPassword: (payload: { token: string; password: string }) =>
    api.post<{ message: string }>('/auth/reset-password', payload),
  validateInvite: (token: string) => api.get<InviteValidationResponse>(`/invites/validate/${token}`),
  registerFromInvite: (payload: { token: string; name: string; password: string }) =>
    api.post<AuthResponse>('/invites/accept', payload)
}
