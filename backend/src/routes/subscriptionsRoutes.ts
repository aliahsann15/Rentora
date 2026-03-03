import { Router } from 'express'
import {
  createCheckoutSession,
  getSubscriptionStatus
} from '../controllers/subscriptionsController'

const router = Router()

router.post('/create-checkout', createCheckoutSession)
router.get('/status', getSubscriptionStatus)

export { router as subscriptionsRoutes }
