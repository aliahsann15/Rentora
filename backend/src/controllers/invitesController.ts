import { randomUUID } from 'crypto'
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { Invite, RefreshToken, Unit, User } from '../models'
import { getTokenExpiryDate, signAccessToken, signRefreshToken } from '../utils/auth'

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

    const invite = await Invite.create({
      email: email.toLowerCase(),
      role,
      organizationId,
      unitId,
      token: randomUUID(),
      expiresAt: getTokenExpiryDate(expiresInDays || 7),
      accepted: false
    })

    return res.status(201).json(invite)
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
