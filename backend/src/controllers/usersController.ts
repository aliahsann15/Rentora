import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import {
  FcmToken,
  Invite,
  MaintenanceRequest,
  Notification,
  RefreshToken,
  Unit,
  User,
  Vendor
} from '../models'
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

    const tenantIds = users
      .filter((user) => user.role === 'TENANT')
      .map((user) => user._id.toString())

    let assignedUnitByTenantId = new Map<string, string>()
    let vendorServicesByUserId = new Map<string, string[]>()

    if (tenantIds.length > 0) {
      const unitsFilter: Record<string, unknown> = {
        tenantId: { $in: tenantIds }
      }

      if (organizationId) {
        unitsFilter.organizationId = organizationId
      }

      const units = await Unit.find(unitsFilter)
        .select('tenantId unitNumber')
        .sort({ createdAt: -1 })

      assignedUnitByTenantId = units.reduce<Map<string, string>>((accumulator, unit) => {
        const tenantId = unit.tenantId?.toString()
        if (tenantId && !accumulator.has(tenantId)) {
          accumulator.set(tenantId, unit.unitNumber)
        }
        return accumulator
      }, new Map<string, string>())
    }

    const vendorUserIds = users
      .filter((user) => user.role === 'VENDOR')
      .map((user) => user._id.toString())

    if (vendorUserIds.length > 0) {
      const vendorsFilter: Record<string, unknown> = {
        userId: { $in: vendorUserIds }
      }

      if (organizationId) {
        vendorsFilter.organizationId = organizationId
      }

      const vendors = await Vendor.find(vendorsFilter)
        .select('userId services')
        .sort({ createdAt: -1 })

      vendorServicesByUserId = vendors.reduce<Map<string, string[]>>((accumulator, vendor) => {
        const userId = vendor.userId?.toString()
        if (userId && !accumulator.has(userId)) {
          accumulator.set(userId, vendor.services || [])
        }
        return accumulator
      }, new Map<string, string[]>())
    }

    const usersWithAssignedUnit = users.map((user) => ({
      ...user.toObject(),
      assignedUnitNumber:
        user.role === 'TENANT' ? (assignedUnitByTenantId.get(user._id.toString()) || null) : null,
      vendorServices:
        user.role === 'VENDOR' ? (vendorServicesByUserId.get(user._id.toString()) || []) : undefined
    }))

    return res.status(200).json(usersWithAssignedUnit)
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
    const organizationId = req.user?.organizationId

    if (!organizationId) {
      return res.status(400).json({ message: 'organizationId is required' })
    }

    const user = await User.findOne({
      _id: req.params.id,
      organizationId
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.role === 'TENANT') {
      await Unit.updateMany(
        { organizationId, tenantId: user._id },
        { $unset: { tenantId: 1 }, $set: { status: 'VACANT' } }
      )

      const tenantRequests = await MaintenanceRequest.find({
        organizationId,
        tenantId: user._id
      }).select('_id')

      const tenantRequestIds = tenantRequests.map((request) => request._id.toString())

      await MaintenanceRequest.deleteMany({ organizationId, tenantId: user._id })

      if (tenantRequestIds.length > 0) {
        await Notification.deleteMany({
          organizationId,
          referenceId: { $in: tenantRequestIds }
        })
      }

      await Invite.deleteMany({
        organizationId,
        role: 'TENANT',
        email: user.email.toLowerCase()
      })
    }

    if (user.role === 'VENDOR') {
      const vendors = await Vendor.find({ organizationId, userId: user._id }).select('_id')
      const vendorIds = vendors.map((vendor) => vendor._id)

      if (vendorIds.length > 0) {
        await MaintenanceRequest.updateMany(
          { organizationId, vendorId: { $in: vendorIds }, status: 'ASSIGNED' },
          { $unset: { vendorId: '', assignedAt: '' }, $set: { status: 'NEW' } }
        )

        await MaintenanceRequest.updateMany(
          { organizationId, vendorId: { $in: vendorIds }, status: { $ne: 'ASSIGNED' } },
          { $unset: { vendorId: '', assignedAt: '' } }
        )

        await Vendor.deleteMany({ organizationId, userId: user._id })
      }

      await Invite.deleteMany({
        organizationId,
        role: 'VENDOR',
        email: user.email.toLowerCase()
      })
    }

    await Notification.deleteMany({ organizationId, userId: user._id })
    await FcmToken.deleteMany({ userId: user._id })
    await RefreshToken.deleteMany({ userId: user._id })

    await User.deleteOne({ _id: user._id, organizationId })

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

    if (!organizationId || !email || !unitId) {
      return res.status(400).json({ message: 'organizationId, email, and unitId are required' })
    }

    const normalizedEmail = email.toLowerCase()

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const generatedPassword = 'Tenant12'
    const passwordHash = await bcrypt.hash(generatedPassword, 12)

    const tenantName = name?.trim() || normalizedEmail.split('@')[0]

    const selectedUnit = await Unit.findOne({
      _id: unitId,
      organizationId
    }).select('_id tenantId unitNumber')

    if (!selectedUnit) {
      return res.status(404).json({ message: 'Selected unit not found' })
    }

    if (selectedUnit.tenantId) {
      return res.status(409).json({ message: 'Selected unit is already assigned to another tenant' })
    }

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

    await Unit.updateOne(
      { _id: selectedUnit._id, organizationId },
      { tenantId: user._id, status: 'OCCUPIED' }
    )

    const resetToken = signAccessToken({
      userId: user._id.toString(),
      organizationId: user.organizationId?.toString(),
      role: user.role
    })

    const resetPasswordLink = `rentora://reset-password/${resetToken}`

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Welcome to Rentora - Your tenant account is ready',
      text: `Welcome to Rentora. Your tenant account has been created.\n\nLogin email: ${normalizedEmail}\nTemporary password: ${generatedPassword}\n\nFor security, reset your password after first login using this link: ${resetPasswordLink}`,
      html: `<p>Welcome to <b>Rentora</b>. Your tenant account has been created.</p><p><b>Login email:</b> ${normalizedEmail}<br/><b>Temporary password:</b> ${generatedPassword}</p><p>For security, reset your password after first login using this link:</p><p><a href="${resetPasswordLink}">${resetPasswordLink}</a></p>`
    })

    return res.status(201).json({
      message: emailResult.delivered
        ? 'Tenant added and onboarding email sent.'
        : 'Tenant added, but onboarding email could not be delivered.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        isActive: user.isActive
      },
      emailDelivered: emailResult.delivered,
      emailFailureReason: emailResult.reason
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create tenant user', error })
  }
}
