import { Router } from 'express'
import {
  createCheckoutSession,
  getSubscriptionStatus
} from '../controllers/subscriptionsController'
import { requireRole } from '../middlewares/requireRole'

const router = Router()

router.post('/create-checkout', requireRole('LANDLORD'), createCheckoutSession)
router.get('/status', getSubscriptionStatus)

export { router as subscriptionsRoutes }
