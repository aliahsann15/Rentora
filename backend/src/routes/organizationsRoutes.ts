import { Router } from 'express'
import {
  getMyOrganization,
  updateOrganization
} from '../controllers/organizationsController'
import { requireRole } from '../middlewares/requireRole'

const router = Router()

router.get('/me', getMyOrganization)
router.patch('/', requireRole('LANDLORD'), updateOrganization)

export { router as organizationsRoutes }
