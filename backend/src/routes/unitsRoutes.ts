import { Router } from 'express'
import {
  createUnit,
  deleteUnit,
  getUnits,
  updateUnit
} from '../controllers/unitsController'

const router = Router()

router.get('/', getUnits)
router.post('/', createUnit)
router.patch('/:id', updateUnit)
router.delete('/:id', deleteUnit)

export { router as unitsRoutes }
