import { Router } from 'express'
import {
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  resetPassword,
  register
} from '../controllers/authController'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/me', getMe)

export { router as authRoutes }
