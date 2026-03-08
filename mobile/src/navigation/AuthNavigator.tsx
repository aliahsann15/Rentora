import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen'
import { InviteRegistrationScreen } from '../screens/auth/InviteRegistrationScreen'
import { AuthStackParamList } from './types'
import { ROUTES } from './routes'
import { colors } from '../utils/theme'

const Stack = createNativeStackNavigator<AuthStackParamList>()

/**
 * Authentication Stack
 * - Login and Register screens for unauthenticated users
 * - No headers or back buttons (linear flow)
 */
export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen name={ROUTES.RESET_PASSWORD} component={ResetPasswordScreen} />
      <Stack.Screen name={ROUTES.INVITE_REGISTRATION} component={InviteRegistrationScreen} />
    </Stack.Navigator>
  )
}
