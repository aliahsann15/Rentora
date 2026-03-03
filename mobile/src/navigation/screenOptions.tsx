import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../utils/theme'

// ============================================================================
// COMMON STACK OPTIONS
// ============================================================================

export const defaultStackOptions: NativeStackNavigationOptions = {
  headerStyle: {
    backgroundColor: colors.surface
  },
  headerShadowVisible: false,
  headerTitleStyle: {
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary
  },
  headerTintColor: colors.primary,
  contentStyle: {
    backgroundColor: colors.background
  }
}

export const modalStackOptions: NativeStackNavigationOptions = {
  ...defaultStackOptions,
  headerRight: ({ tintColor }) => <Ionicons name={"close" as any} size={24} color={tintColor || colors.primary} />,
  presentation: 'modal'
}

export const detailStackOptions: NativeStackNavigationOptions = {
  ...defaultStackOptions,
  headerLeft: ({ tintColor }) => (
    <Ionicons
      name={"chevron-back" as any}
      size={24}
      color={tintColor || colors.primary}
      onPress={() => {}}
    />
  )
}

// ============================================================================
// COMMON TAB OPTIONS
// ============================================================================

export const defaultTabOptions: BottomTabNavigationOptions = {
  headerStyle: {
    backgroundColor: colors.surface
  },
  headerShadowVisible: false,
  headerTitleStyle: {
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary
  },
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8
  },
  tabBarLabelStyle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 2
  }
}

// ============================================================================
// BADGE COMPONENT FOR NOTIFICATION ICONS
// ============================================================================

export const createTabIcon = (iconName: string, color: string) => ({
  color,
  size: 24
})

// ============================================================================
// TAB-SPECIFIC OPTIONS BUILDERS
// ============================================================================

/**
 * Create tab options with badge support (for notification count)
 */
export const createTabScreenOptions = (
  iconName: string,
  label: string,
  accentColor: string,
  badgeCount?: number
): BottomTabNavigationOptions => ({
  ...defaultTabOptions,
  title: label,
  tabBarIcon: ({ color }) => <Ionicons name={iconName as any} size={24} color={color} />,
  tabBarBadge: badgeCount && badgeCount > 0 ? badgeCount : undefined,
  tabBarActiveTintColor: accentColor,
  tabBarInactiveTintColor: colors.textMuted
})

// ============================================================================
// SCREEN-SPECIFIC OPTIONS
// ============================================================================

export const screenOptions = {
  home: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Dashboard'
  }),

  properties: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Properties'
  }),

  propertyDetail: (): NativeStackNavigationOptions => ({
    ...modalStackOptions,
    title: 'Property Details'
  }),

  tenants: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Tenants'
  }),

  tenantDetail: (): NativeStackNavigationOptions => ({
    ...modalStackOptions,
    title: 'Tenant Profile'
  }),

  vendors: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Vendors'
  }),

  vendorDetail: (): NativeStackNavigationOptions => ({
    ...modalStackOptions,
    title: 'Vendor Profile'
  }),

  requests: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Requests'
  }),

  requestDetail: (): NativeStackNavigationOptions => ({
    ...modalStackOptions,
    title: 'Request Details'
  }),

  assignVendor: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Assign Vendor'
  }),

  createRequest: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'New Request'
  }),

  notifications: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Notifications'
  }),

  profile: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Account'
  }),

  completedRequests: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Completed Requests'
  }),

  ratings: (): NativeStackNavigationOptions => ({
    ...defaultStackOptions,
    title: 'Your Ratings'
  }),

  updateStatus: (): NativeStackNavigationOptions => ({
    ...modalStackOptions,
    title: 'Update Status'
  })
}
