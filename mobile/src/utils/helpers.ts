import { RequestStatus } from './constants'

export const formatRequestStatus = (status: RequestStatus): string => {
  return status.replace('_', ' ')
}

export const formatDate = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString()
}

export const formatDateTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleString()
}

export const compactAddress = (parts: Array<string | undefined>): string => {
  return parts.filter(Boolean).join(', ')
}
