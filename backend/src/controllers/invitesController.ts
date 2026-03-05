import { randomUUID } from 'crypto'
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { Invite, RefreshToken, Unit, User, Vendor } from '../models'
import { getTokenExpiryDate, signAccessToken, signRefreshToken } from '../utils/auth'
import { sendEmail } from '../services/emailService'

export const createInvite = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, role, unitId, expiresInDays } = req.body as {
      email?: string
      role?: 'LANDLORD' | 'TENANT' | 'VENDOR'
      unitId?: string
      expiresInDays?: number
    }
    const organizationId = req.user?.organizationId

    if (!email || !role || !organizationId) {
      return res.status(400).json({ message: 'email, role, and organizationId are required' })
    }

    if (role !== 'VENDOR') {
      return res.status(400).json({ message: 'Invites are only supported for vendors.' })
    }

    const normalizedEmail = email.toLowerCase()

    const generatedPassword = 'Vendor1'
    const passwordHash = await bcrypt.hash(generatedPassword, 12)
    const existingUser = await User.findOne({ email: normalizedEmail })

    let user = existingUser

    if (!user) {
      const vendorName = normalizedEmail.split('@')[0]

      user = await User.create({
        name: vendorName,
        email: normalizedEmail,
        passwordHash,
        role: 'VENDOR',
        organizationId,
        isActive: true
      })
    } else {
      if (user.organizationId?.toString() !== organizationId.toString() || user.role !== 'VENDOR') {
        return res.status(409).json({
          message: 'A user with this email already exists and cannot be auto-invited as vendor.'
        })
      }

      user.passwordHash = passwordHash
      user.isActive = true
      await user.save()
    }

    await Vendor.updateOne(
      { userId: user._id, organizationId },
      {
        $setOnInsert: {
          userId: user._id,
          organizationId,
          services: [],
          totalJobs: 0
        },
        $set: { isActive: true }
      },
      { upsert: true }
    )

    const invite = await Invite.create({
      email: normalizedEmail,
      role,
      organizationId,
      unitId,
      token: randomUUID(),
      expiresAt: getTokenExpiryDate(expiresInDays || 7),
      accepted: true
    })

    let emailResult: { delivered: boolean; reason?: string }

    try {
      emailResult = await sendEmail({
        to: invite.email,
        subject: 'Your Rentora vendor account is ready',
        text: `Your vendor account has been created for Rentora.\n\nLogin email: ${normalizedEmail}\nTemporary password: ${generatedPassword}`,
        html: `<p>Your vendor account has been created for <b>Rentora</b>.</p><p><b>Login email:</b> ${normalizedEmail}<br/><b>Temporary password:</b> ${generatedPassword}</p>`
      })
    } catch (error) {
      emailResult = { delivered: false, reason: error instanceof Error ? error.message : 'EMAIL_SEND_FAILED' }
    }

    return res.status(201).json({
      ...invite.toObject(),
      autoAccepted: true,
      userId: user._id,
      generatedPassword,
      emailDelivered: emailResult.delivered,
      emailFailureReason: emailResult.reason
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create invite', error })
  }
}

export const getInvites = async (req: Request, res: Response): Promise<Response> => {
  try {
    const organizationId = req.user?.organizationId
    const email = typeof req.query.email === 'string' ? req.query.email.toLowerCase() : undefined
    const accepted = typeof req.query.accepted === 'string' ? req.query.accepted === 'true' : undefined

    const filter: Record<string, unknown> = {}
    if (organizationId) {
      filter.organizationId = organizationId
    }
    if (email) {
      filter.email = email
    }
    if (accepted !== undefined) {
      filter.accepted = accepted
    }

    const invites = await Invite.find(filter).sort({ createdAt: -1 })
    return res.status(200).json(invites)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch invites', error })
  }
}

export const acceptInvite = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token, name, password, phone, avatar } = req.body as {
      token?: string
      name?: string
      password?: string
      phone?: string
      avatar?: string
    }

    if (!token || !name || !password) {
      return res.status(400).json({ message: 'token, name, and password are required' })
    }

    const invite = await Invite.findOne({ token, accepted: false })
    if (!invite || invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired invite token' })
    }

    const existingUser = await User.findOne({ email: invite.email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await User.create({
      name,
      email: invite.email.toLowerCase(),
      passwordHash,
      role: invite.role,
      organizationId: invite.organizationId,
      phone,
      avatar,
      isActive: true
    })

    invite.accepted = true
    await invite.save()

    if (invite.role === 'TENANT' && invite.unitId) {
      await Unit.findByIdAndUpdate(invite.unitId, {
        tenantId: user._id,
        status: 'OCCUPIED'
      })
    }

    const payload = {
      userId: user._id.toString(),
      organizationId: user.organizationId?.toString(),
      role: user.role
    }

    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: getTokenExpiryDate(30)
    })

    const safeUser = await User.findById(user._id).select('-passwordHash')

    return res.status(200).json({ user: safeUser, accessToken, refreshToken })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to accept invite', error })
  }
}

export const validateInviteToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token } = req.params as { token?: string }

    if (!token) {
      return res.status(400).json({ message: 'token is required' })
    }

    const invite = await Invite.findOne({ token, accepted: false })
    if (!invite || invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired invite token' })
    }

    return res.status(200).json({
      email: invite.email,
      role: invite.role,
      organizationId: invite.organizationId,
      expiresAt: invite.expiresAt
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to validate invite token', error })
  }
}
