export const REQUEST_STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'VERIFIED'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]

export const USER_ROLES = ['LANDLORD', 'TENANT', 'VENDOR'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20
} as const
