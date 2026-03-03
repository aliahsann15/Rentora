import { Router } from 'express'
import {
  acceptInvite,
  createInvite,
  getInvites
} from '../controllers/invitesController'

const router = Router()

router.post('/', createInvite)
router.get('/', getInvites)
router.post('/accept', acceptInvite)

export { router as invitesRoutes }
