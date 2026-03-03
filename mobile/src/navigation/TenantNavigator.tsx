import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { ProfileScreen } from '../screens/ProfileScreen'
import { colors, getRoleAccent } from '../utils/theme'
import {
  TenantTabParamList,
  TenantRequestsStackParamList
} from './types'
import { screenOptions, defaultTabOptions } from './screenOptions'
import { MyRequestsScreen } from '../screens/tenant/MyRequestsScreen'
import { TenantRequestDetailsScreen } from '../screens/tenant/TenantRequestDetailsScreen'
import { NewRequestScreen } from '../screens/tenant/NewRequestScreen'

const Tab = createBottomTabNavigator<TenantTabParamList>()
const RequestStackNavigator = createNativeStackNavigator<TenantRequestsStackParamList>()

// ============================================================================
// DETAIL MODAL STACKS (presented over tabs)
// ============================================================================

const RequestDetailsStack = () => {
  return (
    <RequestStackNavigator.Navigator screenOptions={screenOptions.requestDetail}>
      <RequestStackNavigator.Screen
        name="MyRequestsList"
        component={MyRequestsScreen}
        options={{
          title: 'My Requests'
        }}
      />
      <RequestStackNavigator.Screen
        name="TenantRequestDetails"
        component={TenantRequestDetailsScreen}
        options={{
          title: 'Request Details'
        }}
      />
    </RequestStackNavigator.Navigator>
  )
}

// ============================================================================
// TAB-SPECIFIC WRAPPER SCREENS
// ============================================================================

const ProfileTabScreen = () => <ProfileScreen role="TENANT" />

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
  const tabIcons: Record<keyof TenantTabParamList, string> = {
    MyRequests: 'construct-outline',
    NewRequest: 'add-circle-outline',
    Profile: 'settings-outline'
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...defaultTabOptions,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          return <Ionicons name={(tabIcons[route.name] || 'help-outline') as any} size={size} color={color} />
        }
      })}
    >
      <Tab.Screen
        name="MyRequests"
        component={RequestDetailsStack}
        options={{
          title: 'My Requests',
          headerShown: false
        }}
      />

      <Tab.Screen
        name="NewRequest"
        component={NewRequestScreen}
        options={{
          title: 'New Request'
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileTabScreen}
        options={{
          title: 'Profile'
        }}
      />
    </Tab.Navigator>
  )
}
