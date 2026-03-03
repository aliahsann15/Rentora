import { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../utils/auth'
import { User } from '../models'

const extractBearerToken = (req: Request): string | null => {
  const authorization = req.header('authorization')
  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const payload = verifyToken(token)
    const user = await User.findById(payload.userId)

    if (!user || !user.isActive || !user.organizationId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    req.user = {
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role
    }

    next()
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized', error })
  }
}
