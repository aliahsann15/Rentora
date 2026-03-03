import 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        organizationId: string
        role: 'LANDLORD' | 'TENANT' | 'VENDOR'
      }
    }
  }
}

export {}
