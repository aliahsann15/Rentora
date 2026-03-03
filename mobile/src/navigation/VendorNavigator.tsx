import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { ProfileScreen } from '../screens/ProfileScreen'
import { colors, getRoleAccent } from '../utils/theme'
import {
  VendorTabParamList,
  VendorRequestsStackParamList
} from './types'
import { screenOptions, defaultTabOptions } from './screenOptions'
import { AssignedRequestsScreen } from '../screens/vendor/AssignedRequestsScreen'
import { VendorRequestDetailsScreen } from '../screens/vendor/VendorRequestDetailsScreen'

const Tab = createBottomTabNavigator<VendorTabParamList>()
const RequestStackNavigator = createNativeStackNavigator<VendorRequestsStackParamList>()

// ============================================================================
// DETAIL MODAL STACKS (presented over tabs)
// ============================================================================

const RequestDetailsStack = () => {
  return (
    <RequestStackNavigator.Navigator screenOptions={screenOptions.requestDetail}>
      <RequestStackNavigator.Screen
        name="AssignedRequestsList"
        component={AssignedRequestsScreen}
        options={{
          title: 'Assigned Requests'
        }}
      />
      <RequestStackNavigator.Screen
        name="VendorRequestDetails"
        component={VendorRequestDetailsScreen}
        options={{
          title: 'Request Details'
        }}
      />
    </RequestStackNavigator.Navigator>
  )
}

const ProfileTabScreen = () => <ProfileScreen role="VENDOR" />

// ============================================================================
// VENDOR TABS NAVIGATOR
// ============================================================================

/**
 * Vendor Navigation Structure:
 * - Bottom tab navigation with 2 tabs
 * - Assigned Requests tab uses nested stack for details
 */
export const VendorNavigator = () => {
  const accentColor = getRoleAccent('VENDOR')
  const tabIcons: Record<keyof VendorTabParamList, string> = {
    AssignedRequests: 'construct-outline',
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
        name="AssignedRequests"
        component={RequestDetailsStack}
        options={{
          title: 'Assigned Requests',
          headerShown: false
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
