import { Router } from 'express'
import {
  acceptInvite,
  createInvite,
  getInvites
} from '../controllers/invitesController'
import { authenticateJWT } from '../middlewares/authenticateJWT'
import { attachOrganization } from '../middlewares/attachOrganization'
import { requireSubscriptionActive } from '../middlewares/requireSubscriptionActive'
import { requireRole } from '../middlewares/requireRole'

const router = Router()

router.post('/', authenticateJWT, attachOrganization, requireSubscriptionActive, requireRole('LANDLORD'), createInvite)
router.get('/', authenticateJWT, attachOrganization, requireSubscriptionActive, requireRole('LANDLORD'), getInvites)
router.post('/accept', acceptInvite)

export { router as invitesRoutes }
