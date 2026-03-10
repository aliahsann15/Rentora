import fs from 'fs'
import path from 'path'
import { cert, getApps, initializeApp, App, applicationDefault } from 'firebase-admin/app'
import { getMessaging, Messaging, MulticastMessage } from 'firebase-admin/messaging'
import { FcmToken, Notification, User } from '../models'
import { broadcastNotificationUpdate } from './notificationsGateway'

interface NotificationPayload {
  userIds: string[]
  organizationId: string
  title: string
  body: string
  type: string
  referenceId?: string
  data?: Record<string, string>
}

const toStringId = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof (value as { toString: () => string }).toString === 'function') {
    return (value as { toString: () => string }).toString()
  }

  return ''
}

const isLikelyFcmToken = (token: string): boolean => {
  const normalized = token.trim()
  if (!normalized) {
    return false
  }

  // Exclude Expo-style tokens. FCM registration tokens are long opaque strings.
  if (normalized.startsWith('ExponentPushToken[') || normalized.startsWith('ExpoPushToken[')) {
    return false
  }

  return normalized.length > 20
}

const normalizePrivateKey = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  return value.replace(/\\n/g, '\n')
}

const resolveReadableServiceAccountPath = (rawPath: string): string | null => {
  const candidatePaths = new Set<string>([
    rawPath,
    path.resolve(process.cwd(), rawPath),
    path.resolve(process.cwd(), rawPath.replace(/^\/+/, '')),
    path.resolve(process.cwd(), rawPath.replace(/^\/backend\//, ''))
  ])

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

const getFirebaseServiceAccount = (): Record<string, unknown> | null => {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as Record<string, unknown>
      const privateKey = normalizePrivateKey(parsed.private_key)
      if (privateKey) {
        parsed.private_key = privateKey
      }
      return parsed
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', error)
      return null
    }
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  const fallbackPaths = [
    serviceAccountPath,
    path.resolve(process.cwd(), 'firebase-service-account.json'),
    path.resolve(process.cwd(), 'rentora-fcm-service-account.json'),
    path.resolve(process.cwd(), '../rentora-fcm-service-account.json')
  ].filter(Boolean) as string[]

  for (const rawPath of fallbackPaths) {
    const resolvedPath = resolveReadableServiceAccountPath(rawPath)
    if (!resolvedPath) {
      continue
    }

    try {
      const fileContents = fs.readFileSync(resolvedPath, 'utf8')
      const parsed = JSON.parse(fileContents) as Record<string, unknown>
      const privateKey = normalizePrivateKey(parsed.private_key)
      if (privateKey) {
        parsed.private_key = privateKey
      }
      return parsed
    } catch (error) {
      console.error('Failed to load Firebase service account file', {
        resolvedPath,
        error
      })
      return null
    }
  }

  console.warn('Firebase service account file not found', {
    checkedPaths: fallbackPaths
  })

  return null
}

const getFirebaseMessaging = (): Messaging | null => {
  const existing = getApps()[0]
  if (existing) {
    return getMessaging(existing)
  }

  const serviceAccount = getFirebaseServiceAccount()
  if (serviceAccount) {
    const app: App = initializeApp({
      credential: cert(serviceAccount)
    })
    return getMessaging(app)
  }

  try {
    const app: App = initializeApp({
      credential: applicationDefault()
    })
    return getMessaging(app)
  } catch (error) {
    console.warn('Firebase messaging is not configured. Skipping push send.', error)
    return null
  }
}

const cleanupInvalidTokens = async (tokens: string[]): Promise<void> => {
  if (tokens.length === 0) {
    return
  }

  await Promise.all([
    FcmToken.deleteMany({ token: { $in: tokens } }),
    User.updateMany({}, { $pull: { pushTokens: { $in: tokens } } })
  ])
}

const sendFcmPush = async (
  tokens: string[],
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<void> => {
  const messaging = getFirebaseMessaging()
  if (!messaging) {
    return
  }

  const message: MulticastMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body
    },
    data: payload.data,
    android: {
      priority: 'high',
      notification: {
        channelId: 'default'
      }
    }
  }

  const response = await messaging.sendEachForMulticast(message)

  if (response.failureCount === 0) {
    return
  }

  const invalidTokens: string[] = []
  response.responses.forEach((item, index) => {
    if (item.success) {
      return
    }

    const token = tokens[index]
    const code = item.error?.code || ''

    console.error('FCM send failure', {
      token,
      code,
      message: item.error?.message
    })

    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      invalidTokens.push(token)
    }
  })

  await cleanupInvalidTokens(invalidTokens)
}

export const createNotificationsAndPush = async (payload: NotificationPayload): Promise<void> => {
  const uniqueUserIds = Array.from(new Set(payload.userIds.map(toStringId).filter(Boolean)))

  if (uniqueUserIds.length === 0) {
    return
  }

  await Notification.insertMany(
    uniqueUserIds.map((userId) => ({
      userId,
      organizationId: payload.organizationId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      referenceId: payload.referenceId,
      isRead: false
    }))
  )

  broadcastNotificationUpdate({
    userIds: uniqueUserIds,
    organizationId: payload.organizationId,
    type: payload.type,
    referenceId: payload.referenceId
  })

  const [users, legacyTokens] = await Promise.all([
    User.find({ _id: { $in: uniqueUserIds } }).select('pushTokens'),
    FcmToken.find({ userId: { $in: uniqueUserIds } }).select('token')
  ])

  const tokensFromUsers = users.flatMap((user) => user.pushTokens || [])
  const tokensFromLegacy = legacyTokens.map((tokenRow) => tokenRow.token)

  const tokens = Array.from(new Set([...tokensFromUsers, ...tokensFromLegacy].filter(isLikelyFcmToken)))

  if (tokens.length === 0) {
    console.warn('No push tokens found for notification recipients', {
      userIds: uniqueUserIds,
      type: payload.type,
      referenceId: payload.referenceId
    })
    return
  }

  console.log('Sending FCM push', {
    tokenCount: tokens.length,
    type: payload.type,
    referenceId: payload.referenceId
  })

  await sendFcmPush(tokens, {
    title: payload.title,
    body: payload.body,
    data: payload.data
  })
}
