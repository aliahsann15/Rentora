import { api } from './api'

export interface PropertyItem {
  _id: string
  name: string
  organizationId: string
  address?: {
    line1?: string
    city?: string
    state?: string
    country?: string
    zip?: string
  }
  totalUnits?: number
}

export const propertyService = {
  fetchProperties: () => api.get<PropertyItem[]>('/properties'),
  getPropertyById: (propertyId: string) => api.get<PropertyItem>(`/properties/${propertyId}`)
}
