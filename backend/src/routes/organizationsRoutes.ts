import { Router } from 'express'
import {
  getMyOrganization,
  updateOrganization
} from '../controllers/organizationsController'

const router = Router()

router.get('/me', getMyOrganization)
router.patch('/', updateOrganization)

export { router as organizationsRoutes }
