import { Router } from 'express'
import {
  getNotifications,
  markNotificationAsRead,
  registerDeviceToken
} from '../controllers/notificationsController'

const router = Router()

router.get('/', getNotifications)
router.post('/register-token', registerDeviceToken)
router.patch('/:id/read', markNotificationAsRead)

export { router as notificationsRoutes }
