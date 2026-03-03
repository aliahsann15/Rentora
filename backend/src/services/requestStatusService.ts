import { MaintenanceRequest, Vendor } from '../models'

type RequestStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED'
type UserRole = 'LANDLORD' | 'TENANT' | 'VENDOR'

interface CurrentUser {
  userId: string
  organizationId: string
  role: UserRole
}

const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
  NEW: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE'],
  DONE: ['VERIFIED'],
  VERIFIED: []
}

const ensureSameOrganization = (currentUser: CurrentUser, organizationId: string): void => {
  if (currentUser.organizationId !== organizationId) {
    throw new Error('Cross-organization access is forbidden')
  }
}

const ensureVendorAssigned = async (currentUser: CurrentUser): Promise<string> => {
  const vendor = await Vendor.findOne({
    userId: currentUser.userId,
    organizationId: currentUser.organizationId,
    isActive: true
  })

  if (!vendor) {
    throw new Error('Vendor profile not found')
  }

  return vendor._id.toString()
}

export const getScopedRequestFilter = async (
  currentUser: CurrentUser
): Promise<Record<string, unknown>> => {
  const filter: Record<string, unknown> = {
    organizationId: currentUser.organizationId
  }

  if (currentUser.role === 'TENANT') {
    filter.tenantId = currentUser.userId
  }

  if (currentUser.role === 'VENDOR') {
    const vendorId = await ensureVendorAssigned(currentUser)
    filter.vendorId = vendorId
  }

  return filter
}

export const canCreateRequest = (currentUser: CurrentUser): boolean => {
  return currentUser.role === 'TENANT' || currentUser.role === 'LANDLORD'
}

export const createRequestWithRules = async (
  input: {
    organizationId: string
    propertyId: string
    unitId: string
    tenantId: string
    title: string
    description: string
    images?: string[]
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH'
  },
  currentUser: CurrentUser
) => {
  if (!canCreateRequest(currentUser)) {
    throw new Error('Only tenants and landlords can create requests')
  }

  ensureSameOrganization(currentUser, input.organizationId)

  if (currentUser.role === 'TENANT' && currentUser.userId !== input.tenantId) {
    throw new Error('Tenant can only create request for self')
  }

  return MaintenanceRequest.create({
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    unitId: input.unitId,
    tenantId: input.tenantId,
    title: input.title,
    description: input.description,
    images: input.images || [],
    urgency: input.urgency || 'MEDIUM',
    status: 'NEW'
  })
}

export const assignVendorWithRules = async (
  requestId: string,
  vendorId: string,
  currentUser: CurrentUser
) => {
  if (currentUser.role !== 'LANDLORD') {
    throw new Error('Only landlord can assign vendor')
  }

  const request = await MaintenanceRequest.findOne({
    _id: requestId,
    organizationId: currentUser.organizationId
  })

  if (!request) {
    throw new Error('Request not found')
  }

  if (!allowedTransitions[request.status].includes('ASSIGNED')) {
    throw new Error(`Invalid transition ${request.status} -> ASSIGNED`)
  }

  request.vendorId = vendorId as never
  request.status = 'ASSIGNED'
  request.assignedAt = new Date()

  await request.save()
  return request
}

export const updateStatusWithRules = async (
  requestId: string,
  nextStatus: RequestStatus,
  currentUser: CurrentUser
) => {
  const request = await MaintenanceRequest.findOne({
    _id: requestId,
    organizationId: currentUser.organizationId
  })

  if (!request) {
    throw new Error('Request not found')
  }

  if (currentUser.role === 'TENANT') {
    throw new Error('Tenant cannot update request status')
  }

  if (currentUser.role === 'VENDOR') {
    const vendorId = await ensureVendorAssigned(currentUser)
    if (!request.vendorId || request.vendorId.toString() !== vendorId) {
      throw new Error('Vendor can only update assigned requests')
    }
  }

  if (!allowedTransitions[request.status].includes(nextStatus)) {
    throw new Error(`Invalid transition ${request.status} -> ${nextStatus}`)
  }

  request.status = nextStatus
  if (nextStatus === 'DONE') {
    request.completedAt = new Date()
  }

  await request.save()
  return request
}
