import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AppStackParamList } from './types'
import { LandlordNavigator } from './LandlordNavigator'
import { TenantNavigator } from './TenantNavigator'
import { VendorNavigator } from './VendorNavigator'
import { useAppSelector } from '../hooks/useAppSelector'

const Stack = createNativeStackNavigator<AppStackParamList>()

/**
 * App Stack Navigator
 * Routes between role-specific navigators based on user.role from Redux
 * - LandlordNavigator: For property managers
 * - TenantNavigator: For residents
 * - VendorNavigator: For service providers
 */
export const AppStackNavigator = () => {
  const user = useAppSelector((state) => state.auth.user)

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none'
      }}
    >
      {user?.role === 'LANDLORD' && (
        <Stack.Screen name="LandlordTabs" component={LandlordNavigator} />
      )}

      {user?.role === 'TENANT' && (
        <Stack.Screen name="TenantTabs" component={TenantNavigator} />
      )}

      {user?.role === 'VENDOR' && (
        <Stack.Screen name="VendorTabs" component={VendorNavigator} />
      )}

      {/* Fallback: If role is not recognized, show error screen */}
      {!user || !['LANDLORD', 'TENANT', 'VENDOR'].includes(user.role) && (
        <Stack.Screen name="LandlordTabs" component={LandlordNavigator} />
      )}
    </Stack.Navigator>
  )
}
