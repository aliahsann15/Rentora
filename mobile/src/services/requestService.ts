import { api, RequestItem } from './api'

export interface RequestFilters {
  status?: string
  propertyId?: string
}

export const requestService = {
  fetchRequests: (filters?: RequestFilters) => api.get<RequestItem[]>('/requests', { params: filters }),
  getRequestById: (requestId: string) => api.get<RequestItem>(`/requests/${requestId}`),
  createRequest: (payload: {
    propertyId: string
    unitId: string
    tenantId: string
    title: string
    description: string
    urgency: 'LOW' | 'MEDIUM' | 'HIGH'
    images?: string[]
  }) => api.post<RequestItem>('/requests', payload),
  assignVendor: (payload: { requestId: string; vendorId: string }) =>
    api.patch<RequestItem>(`/requests/${payload.requestId}/assign`, { vendorId: payload.vendorId }),
  updateStatus: (payload: { requestId: string; status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED' }) =>
    api.patch<RequestItem>(`/requests/${payload.requestId}/status`, { status: payload.status }),
  uploadImages: (payload: { requestId: string; images: string[] }) =>
    api.patch<RequestItem>(`/requests/${payload.requestId}/images`, { images: payload.images })
}
