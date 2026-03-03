import { Request, Response } from 'express'
import { Unit } from '../models'
import { getOrganizationIdFromRequest } from '../utils/requestContext'

export const getUnits = async (req: Request, res: Response): Promise<Response> => {
  try {
    const organizationId = getOrganizationIdFromRequest(req)
    const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined

    const filter: Record<string, unknown> = {}
    if (organizationId) {
      filter.organizationId = organizationId
    }
    if (propertyId) {
      filter.propertyId = propertyId
    }
    if (tenantId) {
      filter.tenantId = tenantId
    }

    const units = await Unit.find(filter).sort({ createdAt: -1 })
    return res.status(200).json(units)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch units', error })
  }
}

export const createUnit = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      organizationId,
      propertyId,
      unitNumber,
      tenantId,
      rentAmount,
      leaseStart,
      leaseEnd,
      status
    } = req.body as {
      organizationId?: string
      propertyId?: string
      unitNumber?: string
      tenantId?: string
      rentAmount?: number
      leaseStart?: string
      leaseEnd?: string
      status?: 'OCCUPIED' | 'VACANT'
    }

    if (!organizationId || !propertyId || !unitNumber) {
      return res.status(400).json({ message: 'organizationId, propertyId, and unitNumber are required' })
    }

    const unit = await Unit.create({
      organizationId,
      propertyId,
      unitNumber,
      tenantId,
      rentAmount,
      leaseStart,
      leaseEnd,
      status: status || 'VACANT'
    })

    return res.status(201).json(unit)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create unit', error })
  }
}

export const updateUnit = async (req: Request, res: Response): Promise<Response> => {
  try {
    const allowedFields = ['unitNumber', 'tenantId', 'rentAmount', 'leaseStart', 'leaseEnd', 'status']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field]
      }
    }

    const unit = await Unit.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' })
    }

    return res.status(200).json(unit)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update unit', error })
  }
}

export const deleteUnit = async (req: Request, res: Response): Promise<Response> => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id)
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' })
    }

    return res.status(200).json({ message: 'Unit deleted' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete unit', error })
  }
}
