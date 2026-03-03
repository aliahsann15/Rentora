import { Request, Response } from 'express'
import { Notification } from '../models'

export const getNotifications = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined
    const organizationId = typeof req.query.organizationId === 'string' ? req.query.organizationId : undefined
    const isRead = typeof req.query.isRead === 'string' ? req.query.isRead === 'true' : undefined

    const filter: Record<string, unknown> = {}
    if (userId) {
      filter.userId = userId
    }
    if (organizationId) {
      filter.organizationId = organizationId
    }
    if (isRead !== undefined) {
      filter.isRead = isRead
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 })
    return res.status(200).json(notifications)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications', error })
  }
}

export const markNotificationAsRead = async (req: Request, res: Response): Promise<Response> => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    return res.status(200).json(notification)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notification as read', error })
  }
}
