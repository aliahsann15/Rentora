import { Router } from 'express'
import {
  assignRequestVendor,
  createRequest,
  deleteRequest,
  getRequestById,
  getRequests,
  uploadRequestImages,
  updateRequestStatus,
  verifyRequest
} from '../controllers/requestsController'

const router = Router()

router.get('/', getRequests)
router.post('/', createRequest)
router.get('/:id', getRequestById)
router.delete('/:id', deleteRequest)
router.patch('/:id/status', updateRequestStatus)
router.patch('/:id/images', uploadRequestImages)
router.patch('/:id/assign', assignRequestVendor)
router.patch('/:id/verify', verifyRequest)

export { router as requestsRoutes }
