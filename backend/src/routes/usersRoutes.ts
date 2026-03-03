import { Router } from 'express'
import {
  deleteUser,
  getUserById,
  getUsers,
  updateUser
} from '../controllers/usersController'

const router = Router()

router.get('/', getUsers)
router.get('/:id', getUserById)
router.patch('/:id', updateUser)
router.delete('/:id', deleteUser)

export { router as usersRoutes }
