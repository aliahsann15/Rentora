import { Router } from 'express'
import { handleStripeWebhook } from '../controllers/webhooksController'

const router = Router()

router.post('/stripe', handleStripeWebhook)

export { router as webhooksRoutes }
