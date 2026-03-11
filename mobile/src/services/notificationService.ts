import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { api } from './api'
import { getAccessToken } from './authStorage'

type PushSetupState = {
  hasAttemptedPushRegistration: boolean
  hasLoggedPushRegistrationSkip: boolean
  lastRegisteredUserId: string | null
}

const getPushSetupState = (): PushSetupState => {
  const globalState = globalThis as Record<string, unknown>
  if (!globalState.__rentoraPushSetupState) {
    globalState.__rentoraPushSetupState = {
      hasAttemptedPushRegistration: false,
      hasLoggedPushRegistrationSkip: false,
      lastRegisteredUserId: null
    }
  }

  return globalState.__rentoraPushSetupState as PushSetupState
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
})

const hasAndroidFirebaseConfig = (): boolean => {
  const googleServicesFile = (Constants as any)?.expoConfig?.android?.googleServicesFile
  return typeof googleServicesFile === 'string' && googleServicesFile.trim().length > 0
}

const registerDevice = async (): Promise<string | null> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2C6BED'
    })
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

  const tokenResponse = await Notifications.getDevicePushTokenAsync()
  if (
    Platform.OS === 'android' &&
    tokenResponse.type !== 'fcm' &&
    tokenResponse.type !== 'gcm' &&
    tokenResponse.type !== 'android'
  ) {
    console.warn('Unexpected Android push token type', tokenResponse.type)
    return null
  }

  if (!tokenResponse?.data || typeof tokenResponse.data !== 'string') {
    return null
  }

  // console.log('Push token acquired', {
  //   type: tokenResponse.type,
  //   length: tokenResponse.data.length
  // })

  return tokenResponse.data
}

export const setupPushNotificationsForUser = async (userId: string | null | undefined) => {
  const pushSetupState = getPushSetupState()
  const normalizedUserId = typeof userId === 'string' && userId.trim().length > 0 ? userId : null

  if (!normalizedUserId) {
    pushSetupState.hasAttemptedPushRegistration = false
    pushSetupState.lastRegisteredUserId = null
    return
  }

  if (pushSetupState.lastRegisteredUserId !== normalizedUserId) {
    pushSetupState.hasAttemptedPushRegistration = false
    pushSetupState.lastRegisteredUserId = normalizedUserId
  }

  if (pushSetupState.hasAttemptedPushRegistration) {
    return
  }

  if (Platform.OS === 'android' && !hasAndroidFirebaseConfig()) {
    if (!pushSetupState.hasLoggedPushRegistrationSkip) {
      console.warn(
        'Push notifications are disabled on Android because Firebase is not configured. Add android/app/google-services.json and rebuild the dev client.'
      )
      pushSetupState.hasLoggedPushRegistrationSkip = true
    }
    pushSetupState.hasAttemptedPushRegistration = true
    return
  }

  pushSetupState.hasAttemptedPushRegistration = true

  let token: string | null = null

  try {
    token = await registerDevice()
  } catch (error) {
    console.warn('Push token registration failed', error)
    pushSetupState.hasAttemptedPushRegistration = false
    return
  }

  if (!token) {
    pushSetupState.hasAttemptedPushRegistration = false
    return
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    pushSetupState.hasAttemptedPushRegistration = false
    return
  }

  try {
    await api.post('/notifications/register-token', {
      token,
      device: Platform.OS
    })
    // console.log('Push token registered on backend')
  } catch (error) {
    const statusCode = (error as { response?: { status?: number } })?.response?.status
    if (statusCode === 401) {
      pushSetupState.hasAttemptedPushRegistration = false
      return
    }
    console.warn('Failed to save push token on backend', error)
    pushSetupState.hasAttemptedPushRegistration = false
    return
  }
}
