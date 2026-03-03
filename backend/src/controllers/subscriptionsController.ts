import { Request, Response } from 'express'
import { Organization } from '../models'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

export const createCheckoutSession = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body as {
      priceId?: string
      successUrl?: string
      cancelUrl?: string
    }
    const organizationId = req.user?.organizationId

    if (!organizationId || !priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        message: 'organizationId, priceId, successUrl, and cancelUrl are required'
      })
    }

    if (!stripe) {
      return res.status(503).json({ message: 'Stripe is not configured' })
    }

    const organization = await Organization.findById(organizationId)
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: organization.stripeCustomerId,
      metadata: {
        organizationId: organization._id.toString()
      }
    })

    return res.status(200).json({ id: session.id, url: session.url })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create checkout session', error })
  }
}

export const getSubscriptionStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const organizationId = req.user?.organizationId
    if (!organizationId) {
      return res.status(400).json({ message: 'organizationId is required' })
    }

    const organization = await Organization.findById(organizationId)
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' })
    }

    return res.status(200).json({
      organizationId: organization._id,
      planType: organization.planType,
      subscriptionStatus: organization.subscriptionStatus,
      stripeCustomerId: organization.stripeCustomerId,
      stripeSubscriptionId: organization.stripeSubscriptionId,
      trialEndsAt: organization.trialEndsAt,
      unitLimit: organization.unitLimit,
      isActive: organization.isActive
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch subscription status', error })
  }
}
