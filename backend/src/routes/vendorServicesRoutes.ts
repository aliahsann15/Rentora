import { Router } from 'express'
import {
  addMyVendorService,
  getMyVendorServices,
  removeMyVendorService,
  replaceMyVendorServices
} from '../controllers/vendorServicesController'

const router = Router()

router.get('/me', getMyVendorServices)
router.put('/me', replaceMyVendorServices)
router.post('/me', addMyVendorService)
router.delete('/me/:service', removeMyVendorService)

export { router as vendorServicesRoutes }
