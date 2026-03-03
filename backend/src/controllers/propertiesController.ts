import { Request, Response } from 'express'
import { Property } from '../models'
import { getOrganizationIdFromRequest } from '../utils/requestContext'

export const getProperties = async (req: Request, res: Response): Promise<Response> => {
  try {
    const organizationId = getOrganizationIdFromRequest(req)
    const filter: Record<string, unknown> = {}
    if (organizationId) {
      filter.organizationId = organizationId
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 })
    return res.status(200).json(properties)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch properties', error })
  }
}

export const createProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, address, totalUnits } = req.body as {
      name?: string
      address?: {
        line1: string
        city: string
        state: string
        country: string
        zip: string
      }
      totalUnits?: number
    }

    const organizationId = req.user?.organizationId

    if (!organizationId || !name || !address) {
      return res.status(400).json({ message: 'organizationId, name, and address are required' })
    }

    const property = await Property.create({
      organizationId,
      name,
      address,
      totalUnits: totalUnits || 0
    })

    return res.status(201).json(property)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create property', error })
  }
}

export const getPropertyById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      organizationId: req.user?.organizationId
    })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    return res.status(200).json(property)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch property', error })
  }
}

export const updateProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const allowedFields = ['name', 'address', 'totalUnits']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field]
      }
    }

    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user?.organizationId },
      updates,
      { new: true }
    )
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    return res.status(200).json(property)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update property', error })
  }
}

export const deleteProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const property = await Property.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user?.organizationId
    })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    return res.status(200).json({ message: 'Property deleted' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete property', error })
  }
}
