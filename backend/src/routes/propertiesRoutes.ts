import { Router } from 'express'
import {
  createProperty,
  deleteProperty,
  getProperties,
  getPropertyById,
  updateProperty
} from '../controllers/propertiesController'

const router = Router()

router.get('/', getProperties)
router.post('/', createProperty)
router.get('/:id', getPropertyById)
router.patch('/:id', updateProperty)
router.delete('/:id', deleteProperty)

export { router as propertiesRoutes }
