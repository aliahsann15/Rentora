import { Request, Response } from 'express'
import { FcmToken, Notification, User } from '../models'

export const getNotifications = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.userId
    const organizationId = req.user?.organizationId
    const isRead = typeof req.query.isRead === 'string' ? req.query.isRead === 'true' : undefined

    const filter: Record<string, unknown> = {
      userId,
      organizationId
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
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user?.userId,
        organizationId: req.user?.organizationId
      },
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

export const registerDeviceToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { token, device } = req.body as { token?: string; device?: string }

    if (!token) {
      return res.status(400).json({ message: 'token is required' })
    }

    await Promise.all([
      FcmToken.findOneAndUpdate(
        { userId, token },
        { userId, token, device: device || 'unknown' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
      User.findByIdAndUpdate(userId, { $addToSet: { pushTokens: token } })
    ])

    console.log('Push token registered', {
      userId,
      device: device || 'unknown',
      tokenLength: token.length
    })

    return res.status(200).json({ message: 'Device token registered' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register device token', error })
  }
}
