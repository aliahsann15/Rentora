import { Request, Response } from 'express'
import { Organization } from '../models'
import { getAuthPayloadFromRequest, getOrganizationIdFromRequest } from '../utils/requestContext'

export const getMyOrganization = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authPayload = getAuthPayloadFromRequest(req)
    const organizationId = authPayload?.organizationId || getOrganizationIdFromRequest(req)

    if (!organizationId) {
      return res.status(400).json({ message: 'organizationId is required' })
    }

    const organization = await Organization.findById(organizationId)
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' })
    }

    return res.status(200).json(organization)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch organization', error })
  }
}

export const updateOrganization = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authPayload = getAuthPayloadFromRequest(req)
    const organizationId = authPayload?.organizationId || getOrganizationIdFromRequest(req)

    if (!organizationId) {
      return res.status(400).json({ message: 'organizationId is required' })
    }

    const allowedFields = [
      'name',
      'stripeCustomerId',
      'stripeSubscriptionId',
      'subscriptionStatus',
      'planType',
      'unitLimit',
      'trialEndsAt',
      'isActive'
    ]
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field]
      }
    }

    const organization = await Organization.findByIdAndUpdate(organizationId, updates, { new: true })
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' })
    }

    return res.status(200).json(organization)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update organization', error })
  }
}
