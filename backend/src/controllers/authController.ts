import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { Invite, Organization, RefreshToken, Unit, User } from '../models'
import {
  getTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyToken
} from '../utils/auth'
import { getBearerToken } from '../utils/requestContext'

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

    const passwordHash = await bcrypt.hash(password, 10)

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
