import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import {
  ActivityLog,
  FcmToken,
  Invite,
  MaintenanceRequest,
  Notification,
  Organization,
  Property,
  RefreshToken,
  Unit,
  User,
  Vendor
} from '../models'
import {
  getTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyToken
} from '../utils/auth'
import { getBearerToken } from '../utils/requestContext'
import { sendEmail } from '../services/emailService'
import { getMediaCategoryForUserRole, storeMediaFile } from '../utils/mediaStorage'

const buildAuthPayload = (user: {
  _id: string
  organizationId?: string
  role: 'LANDLORD' | 'TENANT' | 'VENDOR'
}) => ({
  userId: user._id,
  organizationId: user.organizationId,
  role: user.role
})

const saveRefreshToken = async (userId: string, token: string): Promise<void> => {
  await RefreshToken.create({
    userId,
    token,
    expiresAt: getTokenExpiryDate(30)
  })
}

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      name,
      email,
      password,
      phone,
      avatar,
      organizationName,
      inviteToken
    } = req.body as {
      name?: string
      email?: string
      password?: string
      phone?: string
      avatar?: string
      organizationName?: string
      inviteToken?: string
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    let user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      avatar,
      role: 'LANDLORD',
      isActive: true
    })

    if (inviteToken) {
      const invite = await Invite.findOne({ token: inviteToken, accepted: false })
      if (!invite || invite.expiresAt < new Date()) {
        await User.findByIdAndDelete(user._id)
        return res.status(400).json({ message: 'Invalid or expired invite token' })
      }

      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        await User.findByIdAndDelete(user._id)
        return res.status(400).json({ message: 'Invite email does not match' })
      }

      user.role = invite.role
      user.organizationId = invite.organizationId
      await user.save()

      invite.accepted = true
      await invite.save()

      if (invite.role === 'TENANT' && invite.unitId) {
        await Unit.findByIdAndUpdate(invite.unitId, {
          tenantId: user._id,
          status: 'OCCUPIED'
        })
      }
    } else {
      const org = await Organization.create({
        name: organizationName || `${name}'s Organization`,
        ownerId: user._id,
        subscriptionStatus: 'TRIALING',
        planType: 'TRIAL',
        unitLimit: 20,
        trialEndsAt: getTokenExpiryDate(14),
        isActive: true
      })

      user.organizationId = org._id
      await user.save()
    }

    const safeUser = await User.findById(user._id).select('-passwordHash')
    if (!safeUser) {
      return res.status(404).json({ message: 'User not found after registration' })
    }

    const payload = buildAuthPayload({
      _id: safeUser._id.toString(),
      organizationId: safeUser.organizationId?.toString(),
      role: safeUser.role
    })

    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)
    await saveRefreshToken(safeUser._id.toString(), refreshToken)

    return res.status(201).json({ user: safeUser, accessToken, refreshToken })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register', error })
  }
}

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    user.lastLoginAt = new Date()
    await user.save()

    const payload = buildAuthPayload({
      _id: user._id.toString(),
      organizationId: user.organizationId?.toString(),
      role: user.role
    })

    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)
    await saveRefreshToken(user._id.toString(), refreshToken)

    const safeUser = await User.findById(user._id).select('-passwordHash')

    return res.status(200).json({ user: safeUser, accessToken, refreshToken })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login', error })
  }
}

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body as { email?: string }

    if (!email) {
      return res.status(400).json({ message: 'email is required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user || !user.isActive) {
      return res.status(200).json({ message: 'If this email exists, a reset link has been generated.' })
    }

    const payload = buildAuthPayload({
      _id: user._id.toString(),
      organizationId: user.organizationId?.toString(),
      role: user.role
    })

    const resetToken = signAccessToken(payload)
    const resetPasswordLink = `rentora://reset-password/${resetToken}`

    await sendEmail({
      to: user.email,
      subject: 'Reset your Rentora password',
      text: `We received a request to reset your Rentora password. Use this link to set a new password: ${resetPasswordLink}`,
      html: `<p>We received a request to reset your Rentora password.</p><p>Use this link to set a new password:</p><p><a href="${resetPasswordLink}">${resetPasswordLink}</a></p>`
    })

    return res.status(200).json({
      message: 'If this email exists, password reset instructions have been sent.'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process forgot password request', error })
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token, password } = req.body as { token?: string; password?: string }

    if (!token || !password) {
      return res.status(400).json({ message: 'token and password are required' })
    }

    const decoded = verifyToken(token)
    const user = await User.findById(decoded.userId).select('+passwordHash')

    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    user.passwordHash = await bcrypt.hash(password, 12)
    await user.save()

    return res.status(200).json({ message: 'Password has been reset successfully.' })
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired reset token', error })
  }
}

export const changePassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.userId
    const { password } = req.body as { password?: string }

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    const user = await User.findById(userId).select('+passwordHash')
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.passwordHash = await bcrypt.hash(password, 12)
    await user.save()

    return res.status(200).json({ message: 'Password updated successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update password', error })
  }
}

export const refresh = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string }

    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' })
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken })
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const decoded = verifyToken(refreshToken)
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id })
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      organizationId: user.organizationId?.toString(),
      role: user.role
    })

    return res.status(200).json({ accessToken })
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token', error })
  }
}

export const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' })
    }

    await RefreshToken.deleteOne({ token: refreshToken })
    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to logout', error })
  }
}

export const getMe = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const decoded = verifyToken(token)
    const user = await User.findById(decoded.userId).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({ user })
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized', error })
  }
}

export const getMyProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await User.findById(userId).select('_id name email role organizationId avatar isActive')
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Only show tenant-specific info, plus landlord, property, unit
    let landlordName: string | undefined
    let propertyName: string | undefined
    let unitNumber: string | undefined

    if (user.role === 'TENANT') {
      // Find unit assigned to tenant
      const unit = await Unit.findOne({ tenantId: user._id })
        .populate({ path: 'propertyId', select: 'name' })
        .populate({ path: 'organizationId', select: 'ownerId' })
      if (unit) {
        unitNumber = unit.unitNumber
        propertyName = (unit.propertyId as any)?.name
        // Find landlord name from organization owner
        if (unit.organizationId && (unit.organizationId as any)?.ownerId) {
          const landlord = await User.findById((unit.organizationId as any).ownerId).select('name')
          landlordName = landlord?.name
        }
      }
    }

    return res.status(200).json({
      profile: {
        fullName: user.name,
        email: user.email,
        profileImage: user.avatar || undefined,
        landlordName,
        propertyName,
        unitNumber
      }
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile', error })
  }
}

export const updateMyProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { fullName, email, company, companyAddress, profileImage } = req.body as {
      fullName?: string
      email?: string
      company?: string
      companyAddress?: string
      profileImage?: string
    }

    const user = await User.findById(userId)
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (typeof fullName === 'string' && fullName.trim()) {
      user.name = fullName.trim()
    }

    if (typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase()
      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } }).select('_id')

      if (existingUser) {
        return res.status(409).json({ message: 'Email is already in use' })
      }

      user.email = normalizedEmail
    }

    if (req.file) {
      user.avatar = await storeMediaFile({
        buffer: req.file.buffer,
        category: getMediaCategoryForUserRole(user.role),
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        ownerEmail: user.email,
        ownerId: user._id.toString(),
        ownerName: user.name,
        purpose: 'profile-image'
      })
    } else if (typeof profileImage === 'string' && profileImage.trim()) {
      return res.status(400).json({ message: 'Profile images must be uploaded as a file' })
    }

    await user.save()

    if (user.organizationId && (typeof company === 'string' || typeof companyAddress === 'string')) {
      const organizationUpdates: { name?: string; companyAddress?: string } = {}

      if (typeof company === 'string' && company.trim()) {
        organizationUpdates.name = company.trim()
      }

      if (typeof companyAddress === 'string') {
        organizationUpdates.companyAddress = companyAddress.trim()
      }

      if (Object.keys(organizationUpdates).length > 0) {
        await Organization.findByIdAndUpdate(user.organizationId, organizationUpdates)
      }
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: {
        fullName: user.name,
        email: user.email,
        profileImage: user.avatar || undefined
      }
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile', error })
  }
}

export const deleteMyAccount = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.userId
    const organizationId = req.user?.organizationId

    if (!userId || !organizationId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await User.findOne({ _id: userId, organizationId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.role === 'LANDLORD') {
      const organization = await Organization.findOne({
        _id: organizationId,
        ownerId: user._id
      }).select('_id')

      if (!organization) {
        return res.status(403).json({ message: 'Only the organization owner can delete this landlord account' })
      }

      const organizationUsers = await User.find({ organizationId }).select('_id')
      const organizationUserIds = organizationUsers.map((organizationUser) => organizationUser._id)

      await Promise.all([
        ActivityLog.deleteMany({ organizationId }),
        FcmToken.deleteMany({ userId: { $in: organizationUserIds } }),
        Invite.deleteMany({ organizationId }),
        MaintenanceRequest.deleteMany({ organizationId }),
        Notification.deleteMany({ organizationId }),
        Property.deleteMany({ organizationId }),
        RefreshToken.deleteMany({ userId: { $in: organizationUserIds } }),
        Unit.deleteMany({ organizationId }),
        Vendor.deleteMany({ organizationId })
      ])

      await User.deleteMany({ organizationId })
      await Organization.deleteOne({ _id: organizationId })

      return res.status(200).json({ message: 'Account and organization deleted' })
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

    return res.status(200).json({ message: 'Account deleted' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete account', error })
  }
}

export const getMyTenantAssignment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const decoded = verifyToken(token)
    const user = await User.findById(decoded.userId).select('_id role organizationId isActive')
    if (!user || !user.isActive || !user.organizationId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (user.role !== 'TENANT') {
      return res.status(403).json({ message: 'Only tenants can access unit assignment' })
    }

    const assignedUnit = await Unit.findOne({
      organizationId: user.organizationId,
      tenantId: user._id
    })
      .populate({ path: 'propertyId', select: 'name' })
      .select('_id propertyId unitNumber')

    if (!assignedUnit) {
      return res.status(404).json({ message: 'No assigned unit found' })
    }

    const rawProperty = assignedUnit.propertyId as unknown

    const propertyId = (() => {
      if (!rawProperty) {
        return ''
      }

      if (typeof rawProperty === 'string') {
        return rawProperty
      }

      if (typeof rawProperty === 'object' && rawProperty !== null && '_id' in rawProperty) {
        const nestedId = (rawProperty as { _id?: unknown })._id
        if (nestedId) {
          return String(nestedId)
        }
      }

      const asString = String(rawProperty)
      return asString === '[object Object]' ? '' : asString
    })()

    let propertyName =
      typeof rawProperty === 'object' && rawProperty !== null && 'name' in rawProperty
        ? String((rawProperty as { name?: unknown }).name || '')
        : undefined

    if ((!propertyName || !propertyName.trim()) && propertyId) {
      const property = await Property.findById(propertyId).select('name').lean()
      propertyName = property?.name || undefined
    }

    return res.status(200).json({
      unitId: String(assignedUnit._id),
      propertyId,
      propertyName: propertyName || undefined,
      unitNumber: assignedUnit.unitNumber
    })
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized', error })
  }
}
