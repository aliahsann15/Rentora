import { Request, Response } from 'express'
import { Vendor } from '../models'

const normalizeServices = (services: string[]): string[] => {
  const normalized = services
    .map((service) => service.trim())
    .filter(Boolean)

  const uniqueByLowercase = new Map<string, string>()

  for (const service of normalized) {
    const key = service.toLowerCase()
    if (!uniqueByLowercase.has(key)) {
      uniqueByLowercase.set(key, service)
    }
  }

  return Array.from(uniqueByLowercase.values())
}

const getVendorContext = (req: Request): { userId: string; organizationId: string } | null => {
  if (!req.user?.userId || !req.user.organizationId) {
    return null
  }

  return {
    userId: req.user.userId,
    organizationId: req.user.organizationId
  }
}

export const getMyVendorServices = async (req: Request, res: Response): Promise<Response> => {
  try {
    const context = getVendorContext(req)
    if (!context) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const vendor = await Vendor.findOne({
      userId: context.userId,
      organizationId: context.organizationId
    }).select('_id services isActive')

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' })
    }

    return res.status(200).json({
      vendorId: vendor._id,
      services: vendor.services || [],
      isActive: vendor.isActive
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch vendor services', error })
  }
}

export const replaceMyVendorServices = async (req: Request, res: Response): Promise<Response> => {
  try {
    const context = getVendorContext(req)
    if (!context) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { services } = req.body as { services?: string[] }

    if (!Array.isArray(services)) {
      return res.status(400).json({ message: 'services must be an array of strings' })
    }

    const normalizedServices = normalizeServices(services)

    const vendor = await Vendor.findOneAndUpdate(
      { userId: context.userId, organizationId: context.organizationId },
      { services: normalizedServices },
      { new: true }
    ).select('_id services isActive')

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' })
    }

    return res.status(200).json({
      vendorId: vendor._id,
      services: vendor.services || [],
      isActive: vendor.isActive
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update vendor services', error })
  }
}

export const addMyVendorService = async (req: Request, res: Response): Promise<Response> => {
  try {
    const context = getVendorContext(req)
    if (!context) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { service } = req.body as { service?: string }

    if (!service || typeof service !== 'string') {
      return res.status(400).json({ message: 'service is required' })
    }

    const value = service.trim()
    if (!value) {
      return res.status(400).json({ message: 'service is required' })
    }

    const vendor = await Vendor.findOne({
      userId: context.userId,
      organizationId: context.organizationId
    }).select('_id services isActive')

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' })
    }

    const nextServices = normalizeServices([...(vendor.services || []), value])
    vendor.services = nextServices
    await vendor.save()

    return res.status(200).json({
      vendorId: vendor._id,
      services: vendor.services || [],
      isActive: vendor.isActive
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add vendor service', error })
  }
}

export const removeMyVendorService = async (req: Request, res: Response): Promise<Response> => {
  try {
    const context = getVendorContext(req)
    if (!context) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { service } = req.params as { service?: string }

    if (!service) {
      return res.status(400).json({ message: 'service is required' })
    }

    const decodedService = decodeURIComponent(service).trim()
    if (!decodedService) {
      return res.status(400).json({ message: 'service is required' })
    }

    const vendor = await Vendor.findOne({
      userId: context.userId,
      organizationId: context.organizationId
    }).select('_id services isActive')

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' })
    }

    vendor.services = (vendor.services || []).filter(
      (item) => item.toLowerCase() !== decodedService.toLowerCase()
    )

    await vendor.save()

    return res.status(200).json({
      vendorId: vendor._id,
      services: vendor.services || [],
      isActive: vendor.isActive
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove vendor service', error })
  }
}
