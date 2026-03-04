import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models'
import { Unit } from '../models'
import { getOrganizationIdFromRequest } from '../utils/requestContext'
import { signAccessToken } from '../utils/auth'
import { sendEmail } from '../services/emailService'

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

export const createTenantUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const organizationId = req.user?.organizationId
    const {
      email,
      name,
      phone,
      avatar,
      unitId
    } = req.body as {
      email?: string
      name?: string
      phone?: string
      avatar?: string
      unitId?: string
    }

    if (!organizationId || !email) {
      return res.status(400).json({ message: 'organizationId and email are required' })
    }

    const normalizedEmail = email.toLowerCase()

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const generatedPassword = 'Tenant12'
    const passwordHash = await bcrypt.hash(generatedPassword, 12)

    const tenantName = name?.trim() || normalizedEmail.split('@')[0]

    const user = await User.create({
      name: tenantName,
      email: normalizedEmail,
      passwordHash,
      role: 'TENANT',
      organizationId,
      phone,
      avatar,
      isActive: true
    })

    if (unitId) {
      await Unit.findOneAndUpdate(
        { _id: unitId, organizationId },
        { tenantId: user._id, status: 'OCCUPIED' }
      )
    }

    const resetToken = signAccessToken({
      userId: user._id.toString(),
      organizationId: user.organizationId?.toString(),
      role: user.role
    })

    const resetPasswordLink = `rentora://reset-password/${resetToken}`

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Set your Rentora password',
      text: `Welcome to Rentora. Set your password using this link: ${resetPasswordLink}`,
      html: `<p>Welcome to Rentora.</p><p>Set your password using this link:</p><p><a href="${resetPasswordLink}">${resetPasswordLink}</a></p>`
    })

    return res.status(201).json({
      message: emailResult.delivered
        ? 'Tenant added and reset password email sent.'
        : 'Tenant added. SMTP not configured, use reset link for testing.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        isActive: user.isActive
      },
      resetPasswordLink,
      temporaryPassword: generatedPassword,
      emailDelivered: emailResult.delivered,
      emailFailureReason: emailResult.reason
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create tenant user', error })
  }
}
