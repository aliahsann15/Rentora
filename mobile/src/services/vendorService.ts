import { api } from './api'

export interface VendorItem {
  _id: string
  userId: string
  organizationId: string
  specialty?: string[]
  isActive: boolean
  ratingAvg?: number
  completedJobsCount?: number
}

export const vendorService = {
  fetchVendors: () => api.get<VendorItem[]>('/vendors')
}
