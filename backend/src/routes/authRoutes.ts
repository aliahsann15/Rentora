import { Router } from 'express'
import {
  changePassword,
  forgotPassword,
  getMe,
  getMyTenantAssignment,
  login,
  logout,
  refresh,
  resetPassword,
  register
} from '../controllers/authController'
import { authenticateJWT } from '../middlewares/authenticateJWT'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/change-password', authenticateJWT, changePassword)
router.get('/me', getMe)
router.get('/me-assignment', getMyTenantAssignment)

export { router as authRoutes }
