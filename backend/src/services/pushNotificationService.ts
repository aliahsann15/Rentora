import { FcmToken, Notification, User } from '../models'

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

const chunkArray = <T>(input: T[], size: number): T[][] => {
  const output: T[][] = []
  for (let index = 0; index < input.length; index += size) {
    output.push(input.slice(index, index + size))
  }
  return output
}

const sendExpoPush = async (
  messages: Array<{ to: string; title: string; body: string; data?: Record<string, string> }>
): Promise<void> => {
  const chunks = chunkArray(messages, 100)

  for (const chunk of chunks) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chunk)
    })
  }
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

  const [users, legacyTokens] = await Promise.all([
    User.find({ _id: { $in: uniqueUserIds } }).select('pushTokens'),
    FcmToken.find({ userId: { $in: uniqueUserIds } }).select('token')
  ])

  const tokensFromUsers = users.flatMap((user) => user.pushTokens || [])
  const tokensFromLegacy = legacyTokens.map((tokenRow) => tokenRow.token)

  const tokens = Array.from(
    new Set([...tokensFromUsers, ...tokensFromLegacy].filter((token) => token.startsWith('ExponentPushToken[')))
  )

  if (tokens.length === 0) {
    return
  }

  await sendExpoPush(
    tokens.map((token) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data
    }))
  )
}
