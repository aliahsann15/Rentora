import { Request, Response } from 'express'
import { MaintenanceRequest } from '../models'
import {
  assignVendorWithRules,
  createRequestWithRules,
  getScopedRequestFilter,
  updateStatusWithRules
} from '../services/requestStatusService'

const readCurrentUser = (req: Request) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  return req.user
}

const readRequestId = (req: Request): string => {
  const value = req.params.id as unknown
  if (typeof value !== 'string') {
    throw new Error('Invalid request id')
  }

  return value
}

export const getRequests = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUser = readCurrentUser(req)
    const baseFilter = await getScopedRequestFilter(currentUser)

    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const vendorIdQuery = typeof req.query.vendorId === 'string' ? req.query.vendorId : undefined
    const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined

    const filter: Record<string, unknown> = { ...baseFilter }
    if (status) {
      filter.status = status
    }
    if (vendorIdQuery && currentUser.role === 'LANDLORD') {
      filter.vendorId = vendorIdQuery
    }
    if (propertyId) {
      filter.propertyId = propertyId
    }

    const requests = await MaintenanceRequest.find(filter).sort({ createdAt: -1 })
    return res.status(200).json(requests)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch requests', error })
  }
}

export const createRequest = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUser = readCurrentUser(req)

    const {
      propertyId,
      unitId,
      tenantId,
      title,
      description,
      images,
      urgency
    } = req.body as {
      propertyId?: string
      unitId?: string
      tenantId?: string
      title?: string
      description?: string
      images?: string[]
      urgency?: 'LOW' | 'MEDIUM' | 'HIGH'
    }

    if (!propertyId || !unitId || !tenantId || !title || !description) {
      return res.status(400).json({
        message: 'propertyId, unitId, tenantId, title, and description are required'
      })
    }

    const request = await createRequestWithRules({
      organizationId: currentUser.organizationId,
      propertyId,
      unitId,
      tenantId,
      title,
      description,
      images: images || [],
      urgency: urgency || 'MEDIUM'
    }, currentUser)

    return res.status(201).json(request)
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create request', error })
  }
}

export const getRequestById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUser = readCurrentUser(req)
    const filter = await getScopedRequestFilter(currentUser)
    const requestId = readRequestId(req)
    const request = await MaintenanceRequest.findOne({ _id: requestId, ...filter })
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }
    return res.status(200).json(request)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch request', error })
  }
}

export const updateRequestStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUser = readCurrentUser(req)
    const { status } = req.body as { status?: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED' }
    if (!status) {
      return res.status(400).json({ message: 'status is required' })
    }

    const requestId = readRequestId(req)
    const request = await updateStatusWithRules(requestId, status, currentUser)

    return res.status(200).json(request)
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update request status', error })
  }
}

export const assignRequestVendor = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUser = readCurrentUser(req)
    const { vendorId } = req.body as { vendorId?: string }
    if (!vendorId) {
      return res.status(400).json({ message: 'vendorId is required' })
    }

    const requestId = readRequestId(req)
    const request = await assignVendorWithRules(requestId, vendorId, currentUser)

    return res.status(200).json(request)
  } catch (error) {
    return res.status(400).json({ message: 'Failed to assign vendor', error })
  }
}

export const verifyRequest = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUser = readCurrentUser(req)
    const requestId = readRequestId(req)
    const request = await updateStatusWithRules(requestId, 'VERIFIED', currentUser)

    return res.status(200).json(request)
  } catch (error) {
    return res.status(400).json({ message: 'Failed to verify request', error })
  }
}
