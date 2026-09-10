declare module 'multer' {
  import type { Request, RequestHandler } from 'express'

  type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void

  type MulterFile = {
    buffer: Buffer
    mimetype: string
    originalname: string
    size: number
  }

  type MulterOptions = {
    fileFilter?: (req: Request, file: MulterFile, callback: FileFilterCallback) => void
    limits?: {
      fileSize?: number
    }
    storage?: unknown
  }

  type MulterInstance = {
    single: (fieldName: string) => RequestHandler
  }

  type MulterFactory = {
    (options?: MulterOptions): MulterInstance
    memoryStorage: () => unknown
  }

  const multer: MulterFactory
  export default multer
}
