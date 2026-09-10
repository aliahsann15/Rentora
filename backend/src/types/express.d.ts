import 'express'

declare global {
  namespace Express {
    interface MulterFile {
      buffer: Buffer
      mimetype: string
      originalname: string
      size: number
    }

    interface Request {
      file?: MulterFile
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
