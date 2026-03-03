import { NextFunction, Request, Response } from 'express'
import { Organization } from '../models'

const activeStatuses = new Set(['ACTIVE', 'TRIALING'])

export const requireSubscriptionActive = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user?.organizationId) {
    res.status(403).json({ message: 'Organization context is required' })
    return
  }

  const organization = await Organization.findById(req.user.organizationId)
  if (!organization || !organization.isActive) {
    res.status(402).json({ message: 'Organization is inactive' })
    return
  }

  if (organization.subscriptionStatus && !activeStatuses.has(organization.subscriptionStatus)) {
    res.status(402).json({ message: 'Subscription is not active' })
    return
  }

  next()
}
