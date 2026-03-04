import { Request, Response } from 'express'
import { ActivityLog, FcmToken, Invite, MaintenanceRequest, Notification, Property, RefreshToken, Unit, User } from '../models'
import { getOrganizationIdFromRequest } from '../utils/requestContext'

export const getProperties = async (req: Request, res: Response): Promise<Response> => {
  try {
    const organizationId = getOrganizationIdFromRequest(req)
    const filter: Record<string, unknown> = {}
    if (organizationId) {
      filter.organizationId = organizationId
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 })

    if (properties.length === 0) {
      return res.status(200).json([])
    }

    const propertyIds = properties.map((property) => property._id)

    const unitCounts = await Unit.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          ...(organizationId ? { organizationId } : {}),
          propertyId: { $in: propertyIds }
        }
      },
      {
        $group: {
          _id: '$propertyId',
          count: { $sum: 1 }
        }
      }
    ])

    const unitCountByPropertyId = new Map(
      unitCounts.map((item) => [item._id.toString(), item.count])
    )

    const propertiesWithLiveCounts = properties.map((property) => ({
      ...property.toObject(),
      totalUnits: unitCountByPropertyId.get(property._id.toString()) || 0
    }))

    return res.status(200).json(propertiesWithLiveCounts)
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

    if (!address.line1 || !address.city || !address.state || !address.country || !address.zip) {
      return res.status(400).json({ message: 'address.line1, city, state, country, and zip are required' })
    }

    const property = await Property.create({
      organizationId,
      name,
      address,
      totalUnits: totalUnits || 0
    })

    return res.status(201).json(property)
  } catch (error) {
    const validationMessage = (error as { name?: string; message?: string }).name === 'ValidationError'
      ? (error as { message?: string }).message
      : undefined

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage })
    }

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
    const organizationId = req.user?.organizationId
    if (!organizationId) {
      return res.status(400).json({ message: 'organizationId is required' })
    }

    const property = await Property.findOne({
      _id: req.params.id,
      organizationId
    })

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    const propertyId = property._id

    const units = await Unit.find({
      organizationId,
      propertyId
    }).select('_id tenantId')

    const unitIds = units.map((unit) => unit._id)

    const tenantIds = Array.from(
      new Set(
        units
          .map((unit) => unit.tenantId?.toString())
          .filter((tenantId): tenantId is string => Boolean(tenantId))
      )
    )

    let removableTenantIds: string[] = []
    if (tenantIds.length > 0) {
      const tenantIdsWithOtherUnits = await Unit.distinct('tenantId', {
        organizationId,
        tenantId: { $in: tenantIds },
        propertyId: { $ne: propertyId }
      })

      const blocked = new Set(
        tenantIdsWithOtherUnits
          .map((item) => item?.toString())
          .filter((tenantId): tenantId is string => Boolean(tenantId))
      )
      removableTenantIds = tenantIds.filter((tenantId) => !blocked.has(tenantId))
    }

    const requests = await MaintenanceRequest.find({
      organizationId,
      $or: [
        { propertyId },
        ...(unitIds.length > 0 ? [{ unitId: { $in: unitIds } }] : [])
      ]
    }).select('_id')

    const requestIds = requests.map((request) => request._id)
    const requestReferenceIds = requestIds.map((id) => id.toString())

    const requestDeleteResult = await MaintenanceRequest.deleteMany({
      organizationId,
      $or: [
        { propertyId },
        ...(unitIds.length > 0 ? [{ unitId: { $in: unitIds } }] : []),
        ...(removableTenantIds.length > 0 ? [{ tenantId: { $in: removableTenantIds } }] : [])
      ]
    })

    const unitDeleteResult = await Unit.deleteMany({ organizationId, propertyId })

    if (unitIds.length > 0) {
      await Invite.deleteMany({
        organizationId,
        unitId: { $in: unitIds }
      })
    }

    await ActivityLog.deleteMany({
      organizationId,
      $or: [
        { entityType: 'PROPERTY', entityId: propertyId },
        ...(unitIds.length > 0 ? [{ entityType: 'UNIT', entityId: { $in: unitIds } }] : []),
        ...(requestIds.length > 0 ? [{ entityType: 'REQUEST', entityId: { $in: requestIds } }] : [])
      ]
    })

    if (requestReferenceIds.length > 0) {
      await Notification.deleteMany({
        organizationId,
        referenceId: { $in: requestReferenceIds }
      })
    }

    if (removableTenantIds.length > 0) {
      await Notification.deleteMany({ userId: { $in: removableTenantIds } })
      await FcmToken.deleteMany({ userId: { $in: removableTenantIds } })
      await RefreshToken.deleteMany({ userId: { $in: removableTenantIds } })
      await User.deleteMany({
        _id: { $in: removableTenantIds },
        organizationId,
        role: 'TENANT'
      })
    }

    await Property.deleteOne({ _id: propertyId, organizationId })

    return res.status(200).json({
      message: 'Property and related records deleted',
      deleted: {
        propertyId: propertyId.toString(),
        units: unitDeleteResult.deletedCount || 0,
        requests: requestDeleteResult.deletedCount || 0,
        tenants: removableTenantIds.length
      }
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete property', error })
  }
}
