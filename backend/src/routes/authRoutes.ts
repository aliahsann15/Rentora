import { Router } from 'express'
import multer from 'multer'
import {
  changePassword,
  deleteMyAccount,
  forgotPassword,
  getMe,
  getMyProfile,
  getMyTenantAssignment,
  login,
  logout,
  refresh,
  resetPassword,
  register,
  updateMyProfile
} from '../controllers/authController'
import { authenticateJWT } from '../middlewares/authenticateJWT'
import { allowedImageMimeTypes } from '../utils/mediaStorage'

const router = Router()
const profileImageUpload = multer({
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      callback(new Error('Only PNG, JPG, GIF, and WEBP images are supported'))
      return
    }

    callback(null, true)
  }
})

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/change-password', authenticateJWT, changePassword)
router.delete('/account', authenticateJWT, deleteMyAccount)
router.get('/me', authenticateJWT, getMe)
router.get('/profile', authenticateJWT, getMyProfile)
router.patch('/profile', authenticateJWT, profileImageUpload.single('profileImageFile'), updateMyProfile)
router.get('/me-assignment', getMyTenantAssignment)

export { router as authRoutes }
