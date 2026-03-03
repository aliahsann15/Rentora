import AsyncStorage from '@react-native-async-storage/async-storage'

const ACCESS_TOKEN_KEY = 'rentora_access_token'
const REFRESH_TOKEN_KEY = 'rentora_refresh_token'

export const setTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export const getAccessToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY)
}

export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY)
}

export const removeTokens = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY)
}
