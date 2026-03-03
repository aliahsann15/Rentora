import 'express'

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer
      user?: {
        userId: string
        organizationId: string
        role: 'LANDLORD' | 'TENANT' | 'VENDOR'
      }
    }
  }
}

export {}
