import { Request, Response } from 'express'
import Stripe from 'stripe'
import { Organization } from '../models'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

export const handleStripeWebhook = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!stripe || !webhookSecret) {
      return res.status(503).json({ message: 'Stripe webhook is not configured' })
    }

    const signature = req.header('stripe-signature')
    if (!signature) {
      return res.status(400).json({ message: 'Missing stripe-signature header' })
    }

    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : undefined
      if (customerId) {
        await Organization.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { subscriptionStatus: 'ACTIVE', isActive: true }
        )
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : undefined
      if (customerId) {
        await Organization.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { subscriptionStatus: 'CANCELED', isActive: false }
        )
      }
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    return res.status(400).json({ message: 'Webhook processing failed', error })
  }
}
