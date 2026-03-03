import axios from 'axios'
import { getAccessToken, removeTokens } from './authStorage'

const API_BASE_URL = 'http://192.168.100.141:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
})

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await removeTokens()
    }

    return Promise.reject(error)
  }
)

export interface AuthResponse {
  user: {
    _id: string
    name: string
    email: string
    role: 'LANDLORD' | 'TENANT' | 'VENDOR'
    organizationId: string
  }
  accessToken: string
  refreshToken: string
}

export interface RequestItem {
  _id: string
  title: string
  description: string
  images: string[]
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED'
  urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  tenantId?: string
  vendorId?: string
  propertyId?: string
  unitId?: string
  createdAt: string
}
