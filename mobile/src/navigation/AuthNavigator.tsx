import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen'
import { InviteRegistrationScreen } from '../screens/auth/InviteRegistrationScreen'
import { AuthStackParamList } from './types'

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
        contentStyle: { backgroundColor: '#1E3A8A' }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="InviteRegistration" component={InviteRegistrationScreen} />
    </Stack.Navigator>
  )
}
