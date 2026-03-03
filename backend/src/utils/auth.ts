import jwt from 'jsonwebtoken'

export interface AuthTokenPayload {
  userId: string
  organizationId?: string
  role?: 'LANDLORD' | 'TENANT' | 'VENDOR'
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'

export const signAccessToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] })
}

export const signRefreshToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] })
}

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload
}

export const getTokenExpiryDate = (daysFromNow: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}
