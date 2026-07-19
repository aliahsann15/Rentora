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
import { defaultTabOptions } from './screenOptions'
import { AssignedRequestsScreen } from '../screens/vendor/AssignedRequestsScreen'
import { VendorRequestDetailsScreen } from '../screens/vendor/VendorRequestDetailsScreen'
import { VendorServicesScreen } from '../screens/vendor/VendorServicesScreen'
import { ROUTES } from './routes'

const Tab = createBottomTabNavigator<VendorTabParamList>()
const RequestStackNavigator = createNativeStackNavigator<VendorRequestsStackParamList>()

// ============================================================================
// DETAIL MODAL STACKS (presented over tabs)
// ============================================================================

const RequestDetailsStack = () => {
  return (
    <RequestStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <RequestStackNavigator.Screen
        name={ROUTES.ASSIGNED_REQUESTS_LIST}
        component={AssignedRequestsScreen}
        options={{
          title: 'Assigned Requests'
        }}
      />
      <RequestStackNavigator.Screen
        name={ROUTES.VENDOR_REQUEST_DETAILS}
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
  const tabIcons: Record<keyof VendorTabParamList, keyof typeof Ionicons.glyphMap> = {
    [ROUTES.ASSIGNED_REQUESTS]: 'construct-outline',
    [ROUTES.VENDOR_SERVICES]: 'briefcase-outline',
    [ROUTES.PROFILE]: 'settings-outline'
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...defaultTabOptions,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const iconName = tabIcons[route.name as keyof VendorTabParamList] || 'help-outline'
          return <Ionicons name={iconName} size={22} color={color} />
        }
      })}
    >
      <Tab.Screen
        name={ROUTES.ASSIGNED_REQUESTS}
        component={RequestDetailsStack}
        options={{
          title: 'Assigned Requests',
          headerShown: false
        }}
      />

      <Tab.Screen
        name={ROUTES.VENDOR_SERVICES}
        component={VendorServicesScreen}
        options={{
          title: 'Services'
        }}
      />

      <Tab.Screen
        name={ROUTES.PROFILE}
        component={ProfileTabScreen}
        options={{
          title: 'Settings'
        }}
      />
    </Tab.Navigator>
  )
}
