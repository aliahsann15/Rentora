import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { api } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
})

const getProjectId = (): string | undefined => {
  const easProjectId = Constants?.expoConfig?.extra?.eas?.projectId
  const fallbackProjectId = (Constants as any)?.easConfig?.projectId

  if (typeof easProjectId === 'string') {
    return easProjectId
  }

  if (typeof fallbackProjectId === 'string') {
    return fallbackProjectId
  }

  return undefined
}

const isExpoGo = (): boolean => {
  const appOwnership = (Constants as any)?.appOwnership
  const executionEnvironment = (Constants as any)?.executionEnvironment

  return appOwnership === 'expo' || executionEnvironment === 'storeClient'
}

const registerDevice = async (): Promise<string | null> => {
  if (isExpoGo()) {
    return null
  }

  const permissions = await Notifications.getPermissionsAsync()
  let finalStatus = permissions.status

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    finalStatus = requested.status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: getProjectId()
  })

  return tokenResponse.data
}

export const setupPushNotificationsForUser = async (isAuthenticated: boolean) => {
  if (!isAuthenticated) {
    return
  }

  let token: string | null = null

  try {
    token = await registerDevice()
  } catch {
    return
  }

  if (!token) {
    return
  }

  try {
    await api.post('/notifications/register-token', {
      token,
      device: Platform.OS
    })
  } catch {
    return
  }
}
