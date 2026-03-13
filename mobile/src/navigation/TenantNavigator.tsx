import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { colors, getRoleAccent } from '../utils/theme'
import {
  TenantTabParamList,
  TenantRequestsStackParamList,
  TenantSettingsStackParamList
} from './types'
import { defaultTabOptions } from './screenOptions'
import { MyRequestsScreen } from '../screens/tenant/MyRequestsScreen'
import { TenantRequestDetailsScreen } from '../screens/tenant/TenantRequestDetailsScreen'
import { NewRequestScreen } from '../screens/tenant/NewRequestScreen'
import { TenantSettingsScreen } from '../screens/tenant/TenantSettingsScreen'
import { TenantProfileScreen } from '../screens/tenant/TenantProfileScreen'
import { EditTenantProfileScreen } from '../screens/tenant/EditTenantProfileScreen'
import { TenantChangePasswordScreen } from '../screens/tenant/TenantChangePasswordScreen'
import { ROUTES } from './routes'

const Tab = createBottomTabNavigator<TenantTabParamList>()
const RequestStackNavigator = createNativeStackNavigator<TenantRequestsStackParamList>()
const SettingsStackNavigator = createNativeStackNavigator<TenantSettingsStackParamList>()

// ============================================================================
// DETAIL MODAL STACKS (presented over tabs)
// ============================================================================

const RequestDetailsStack = () => {
  return (
    <RequestStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <RequestStackNavigator.Screen
        name={ROUTES.MY_REQUESTS_LIST}
        component={MyRequestsScreen}
        options={{
          title: 'My Requests'
        }}
      />
      <RequestStackNavigator.Screen
        name={ROUTES.TENANT_REQUEST_DETAILS}
        component={TenantRequestDetailsScreen}
        options={{
          title: 'Request Details'
        }}
      />
    </RequestStackNavigator.Navigator>
  )
}

const TenantSettingsStack = () => {
  return (
    <SettingsStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStackNavigator.Screen
        name={ROUTES.TENANT_SETTINGS_HOME}
        component={TenantSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStackNavigator.Screen
        name={ROUTES.TENANT_PROFILE}
        component={TenantProfileScreen}
        options={{ title: 'Profile' }}
      />
      <SettingsStackNavigator.Screen
        name={ROUTES.EDIT_TENANT_PROFILE}
        component={EditTenantProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <SettingsStackNavigator.Screen
        name={ROUTES.TENANT_CHANGE_PASSWORD}
        component={TenantChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
    </SettingsStackNavigator.Navigator>
  )
}

// ============================================================================
// TAB-SPECIFIC WRAPPER SCREENS
// ============================================================================

// ============================================================================
// TENANT TABS NAVIGATOR
// ============================================================================

/**
 * Tenant Navigation Structure:
 * - Bottom tab navigation with 3 tabs
 * - My Requests tab uses a nested stack for read-only details
 */
export const TenantNavigator = () => {
  const accentColor = getRoleAccent('TENANT')
  const tabIcons: Record<keyof TenantTabParamList, keyof typeof Ionicons.glyphMap> = {
    [ROUTES.MY_REQUESTS]: 'construct-outline',
    [ROUTES.NEW_REQUEST]: 'add-circle-outline',
    [ROUTES.PROFILE]: 'settings-outline'
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...defaultTabOptions,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const iconName = tabIcons[route.name as keyof TenantTabParamList] || 'help-outline'
          return <Ionicons name={iconName} size={size} color={color} />
        }
      })}
    >
      <Tab.Screen
        name={ROUTES.MY_REQUESTS}
        component={RequestDetailsStack}
        options={{
          title: 'My Requests',
          headerShown: false
        }}
      />

      <Tab.Screen
        name={ROUTES.NEW_REQUEST}
        component={NewRequestScreen}
        options={{
          title: 'New Request'
        }}
      />

      <Tab.Screen
        name={ROUTES.PROFILE}
        component={TenantSettingsStack}
        options={{
          title: 'Settings',
          headerShown: false
        }}
      />
    </Tab.Navigator>
  )
}
