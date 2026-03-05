import { Request, Response } from 'express'
import { Vendor } from '../models'
import { getOrganizationIdFromRequest } from '../utils/requestContext'

export const getVendors = async (req: Request, res: Response): Promise<Response> => {
  try {
    const organizationId = getOrganizationIdFromRequest(req)
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined
    const filter: Record<string, unknown> = {}
    if (organizationId) {
      filter.organizationId = organizationId
    }
    if (userId) {
      filter.userId = userId
    }

    const vendors = await Vendor.find(filter)
      .populate({ path: 'userId', select: 'name email' })
      .sort({ createdAt: -1 })
    return res.status(200).json(vendors)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch vendors', error })
  }
}

export const createVendor = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, services, rating, totalJobs, notes, isActive } = req.body as {
      userId?: string
      services?: string[]
      rating?: number
      totalJobs?: number
      notes?: string
      isActive?: boolean
    }

    const organizationId = req.user?.organizationId

    if (!userId || !organizationId) {
      return res.status(400).json({ message: 'userId and organizationId are required' })
    }

    const vendor = await Vendor.create({
      userId,
      organizationId,
      services: services || [],
      rating,
      totalJobs: totalJobs || 0,
      notes,
      isActive: isActive ?? true
    })

    return res.status(201).json(vendor)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create vendor', error })
  }
}

export const updateVendor = async (req: Request, res: Response): Promise<Response> => {
  try {
    const allowedFields = ['services', 'rating', 'totalJobs', 'notes', 'isActive']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field]
      }
    }

    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user?.organizationId },
      updates,
      { new: true }
    )
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' })
    }

    return res.status(200).json(vendor)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update vendor', error })
  }
}

export const deleteVendor = async (req: Request, res: Response): Promise<Response> => {
  try {
    const vendor = await Vendor.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user?.organizationId
    })
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' })
    }

    return res.status(200).json({ message: 'Vendor deleted' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete vendor', error })
  }
}
