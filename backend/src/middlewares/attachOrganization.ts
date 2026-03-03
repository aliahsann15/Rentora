import { NextFunction, Request, Response } from 'express'

export const attachOrganization = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.organizationId) {
    res.status(403).json({ message: 'Organization context is required' })
    return
  }

  next()
}
