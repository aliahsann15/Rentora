import { Router } from 'express'
import {
  getMe,
  login,
  logout,
  refresh,
  register
} from '../controllers/authController'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', getMe)

export { router as authRoutes }
