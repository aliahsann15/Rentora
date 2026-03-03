import { Router } from 'express'
import {
  createVendor,
  deleteVendor,
  getVendors,
  updateVendor
} from '../controllers/vendorsController'

const router = Router()

router.get('/', getVendors)
router.post('/', createVendor)
router.patch('/:id', updateVendor)
router.delete('/:id', deleteVendor)

export { router as vendorsRoutes }
