import { Request, Response } from 'express'
import { User } from '../models'
import { getOrganizationIdFromRequest } from '../utils/requestContext'

export const getUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const organizationId = getOrganizationIdFromRequest(req)
    const role = typeof req.query.role === 'string' ? req.query.role : undefined

    const filter: Record<string, unknown> = {}
    if (organizationId) {
      filter.organizationId = organizationId
    }
    if (role) {
      filter.role = role
    }

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 })
    return res.status(200).json(users)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error })
  }
}

export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      organizationId: req.user?.organizationId
    }).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.status(200).json(user)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user', error })
  }
}

export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const allowedFields = ['name', 'phone', 'avatar', 'role', 'isActive']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field]
      }
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user?.organizationId },
      updates,
      { new: true }
    ).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json(user)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user', error })
  }
}

export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user?.organizationId
    })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({ message: 'User deleted' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error })
  }
}
