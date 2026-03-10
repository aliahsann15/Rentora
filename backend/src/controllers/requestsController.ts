import { Request, Response } from 'express'
import { MaintenanceRequest, User, Vendor } from '../models'
import {
  addRequestImagesWithRules,
  assignVendorWithRules,
  createRequestWithRules,
  deleteRequestWithRules,
  getScopedRequestFilter,
  updateStatusWithRules
} from '../services/requestStatusService'
import { createNotificationsAndPush } from '../services/pushNotificationService'
import { broadcastNotificationUpdate } from '../services/notificationsGateway'

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

const toIdString = (value: unknown): string | undefined => {
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null && '_id' in (value as Record<string, unknown>)) {
    const nestedId = (value as { _id?: unknown })._id
    return nestedId ? String(nestedId) : undefined
  }

  return String(value)
}

const serializeRequest = (request: Record<string, unknown>) => {
  const property = request.propertyId as Record<string, unknown> | string | undefined
  const unit = request.unitId as Record<string, unknown> | string | undefined
  const propertyName =
    property && typeof property === 'object' && 'name' in property
      ? String(property.name || '')
      : undefined
  const unitNumber =
    unit && typeof unit === 'object' && 'unitNumber' in unit
      ? String(unit.unitNumber || '')
      : undefined

  return {
    ...request,
    _id: toIdString(request._id),
    propertyId: toIdString(request.propertyId),
    unitId: toIdString(request.unitId),
    tenantId: toIdString(request.tenantId),
    vendorId: toIdString(request.vendorId),
    propertyName: propertyName || undefined,
    unitNumber: unitNumber || undefined
  }
}

const getLandlordRecipientIds = async (organizationId: string): Promise<string[]> => {
  const landlords = await User.find({
    organizationId,
    role: 'LANDLORD',
    // Legacy records may not have this field; treat missing as active.
    isActive: { $ne: false }
  }).select('_id')

  return landlords.map((landlord) => landlord._id.toString())
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

    const requests = await MaintenanceRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'propertyId', select: 'name' })
      .populate({ path: 'unitId', select: 'unitNumber' })
      .lean()

    return res.status(200).json(requests.map((item) => serializeRequest(item as unknown as Record<string, unknown>)))
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

    if (currentUser.role === 'TENANT') {
      const landlordRecipientIds = await getLandlordRecipientIds(currentUser.organizationId)

      if (landlordRecipientIds.length > 0) {
        try {
          await createNotificationsAndPush({
            userIds: landlordRecipientIds,
            organizationId: currentUser.organizationId,
            title: 'New request',
            body: request.title,
            type: 'REQUEST_NEW',
            referenceId: request._id.toString(),
            data: { requestId: request._id.toString() }
          })
        } catch (error) {
          console.error('Failed to notify landlords for new tenant request', {
            requestId: request._id.toString(),
            organizationId: currentUser.organizationId,
            error
          })
        }
      }
    }

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
      .populate({ path: 'propertyId', select: 'name' })
      .populate({ path: 'unitId', select: 'unitNumber' })
      .lean()
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }
    return res.status(200).json(serializeRequest(request as unknown as Record<string, unknown>))
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

    const landlords = await getLandlordRecipientIds(currentUser.organizationId)

    const recipients = [request.tenantId?.toString(), ...landlords]
      .filter(Boolean) as string[]

    try {
      await createNotificationsAndPush({
        userIds: recipients,
        organizationId: currentUser.organizationId,
        title: 'Request status updated',
        body: `${request.title} is now ${request.status}`,
        type: 'REQUEST_STATUS_CHANGED',
        referenceId: request._id.toString(),
        data: { requestId: request._id.toString(), status: request.status }
      })
    } catch {}

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

    const assignedVendor = await Vendor.findOne({
      _id: vendorId,
      organizationId: currentUser.organizationId,
      isActive: true
    }).select('userId')

    if (assignedVendor?.userId) {
      try {
        await createNotificationsAndPush({
          userIds: [assignedVendor.userId.toString()],
          organizationId: currentUser.organizationId,
          title: 'New assignment',
          body: request.title,
          type: 'REQUEST_ASSIGNED',
          referenceId: request._id.toString(),
          data: { requestId: request._id.toString() }
        })
      } catch (error) {
        console.error('Failed to notify assigned vendor', {
          requestId: request._id.toString(),
          vendorId,
          error
        })
      }
    }

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

export const uploadRequestImages = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUser = readCurrentUser(req)
    const { images } = req.body as { images?: string[] }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'images is required' })
    }

    const requestId = readRequestId(req)
    const request = await addRequestImagesWithRules(requestId, images, currentUser)

    return res.status(200).json(request)
  } catch (error) {
    return res.status(400).json({ message: 'Failed to upload request images', error })
  }
}

export const deleteRequest = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUser = readCurrentUser(req)
    const requestId = readRequestId(req)
    const request = await deleteRequestWithRules(requestId, currentUser)

    const landlords = await getLandlordRecipientIds(currentUser.organizationId)
    const recipientIds = Array.from(
      new Set([request.tenantId?.toString(), ...landlords].filter(Boolean) as string[])
    )

    broadcastNotificationUpdate({
      userIds: recipientIds,
      organizationId: currentUser.organizationId,
      type: 'REQUEST_DELETED',
      referenceId: request._id.toString()
    })

    return res.status(200).json({ message: 'Request deleted', requestId: request._id.toString() })
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete request', error })
  }
}
