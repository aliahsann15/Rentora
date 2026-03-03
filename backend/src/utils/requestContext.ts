import { Request } from 'express'
import { AuthTokenPayload, verifyToken } from './auth'

export const getOrganizationIdFromRequest = (req: Request): string | undefined => {
  if (req.user?.organizationId) {
    return req.user.organizationId
  }

  const fromHeader = req.header('x-organization-id')
  const fromQuery = typeof req.query.organizationId === 'string' ? req.query.organizationId : undefined
  const fromBody = typeof req.body?.organizationId === 'string' ? req.body.organizationId : undefined
  return fromHeader || fromQuery || fromBody
}

export const getBearerToken = (req: Request): string | undefined => {
  const authorization = req.header('authorization')
  if (!authorization) {
    return undefined
  }

  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return undefined
  }

  return token
}

export const getAuthPayloadFromRequest = (req: Request): AuthTokenPayload | null => {
  const token = getBearerToken(req)
  if (!token) {
    return null
  }

  try {
    return verifyToken(token)
  } catch {
    return null
  }
}
