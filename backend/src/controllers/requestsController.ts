import { Request, Response } from 'express'
import { MaintenanceRequest } from '../models'
import { getOrganizationIdFromRequest } from '../utils/requestContext'

export const getRequests = async (req: Request, res: Response): Promise<Response> => {
  try {
    const organizationId = getOrganizationIdFromRequest(req)
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const vendorId = typeof req.query.vendorId === 'string' ? req.query.vendorId : undefined
    const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined

    const filter: Record<string, unknown> = {}
    if (organizationId) {
      filter.organizationId = organizationId
    }
    if (status) {
      filter.status = status
    }
    if (vendorId) {
      filter.vendorId = vendorId
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
    const {
      organizationId,
      propertyId,
      unitId,
      tenantId,
      vendorId,
      title,
      description,
      images,
      urgency
    } = req.body as {
      organizationId?: string
      propertyId?: string
      unitId?: string
      tenantId?: string
      vendorId?: string
      title?: string
      description?: string
      images?: string[]
      urgency?: 'LOW' | 'MEDIUM' | 'HIGH'
    }

    if (!organizationId || !propertyId || !unitId || !tenantId || !title || !description) {
      return res.status(400).json({
        message: 'organizationId, propertyId, unitId, tenantId, title, and description are required'
      })
    }

    const request = await MaintenanceRequest.create({
      organizationId,
      propertyId,
      unitId,
      tenantId,
      vendorId,
      title,
      description,
      images: images || [],
      urgency: urgency || 'MEDIUM',
      status: vendorId ? 'ASSIGNED' : 'NEW',
      assignedAt: vendorId ? new Date() : undefined
    })

    return res.status(201).json(request)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create request', error })
  }
}

export const getRequestById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
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
    const { status } = req.body as { status?: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED' }
    if (!status) {
      return res.status(400).json({ message: 'status is required' })
    }

    const updates: Record<string, unknown> = { status }
    if (status === 'DONE' || status === 'VERIFIED') {
      updates.completedAt = new Date()
    }

    const request = await MaintenanceRequest.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    return res.status(200).json(request)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update request status', error })
  }
}

export const assignRequestVendor = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { vendorId } = req.body as { vendorId?: string }
    if (!vendorId) {
      return res.status(400).json({ message: 'vendorId is required' })
    }

    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      { vendorId, status: 'ASSIGNED', assignedAt: new Date() },
      { new: true }
    )

    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    return res.status(200).json(request)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to assign vendor', error })
  }
}

export const verifyRequest = async (req: Request, res: Response): Promise<Response> => {
  try {
    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'VERIFIED', completedAt: new Date() },
      { new: true }
    )

    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    return res.status(200).json(request)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify request', error })
  }
}
