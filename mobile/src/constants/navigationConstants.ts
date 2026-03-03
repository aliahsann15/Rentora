/**
 * Navigation Constants
 * Centralized route names, tab configurations, and navigation settings
 */

// ============================================================================
// ROUTE NAMES
// ============================================================================

export const RootRouteNames = {
  Auth: 'Auth',
  App: 'App'
} as const

export const AuthRouteNames = {
  Login: 'Login',
  Register: 'Register',
  ForgotPassword: 'ForgotPassword',
  ResetPassword: 'ResetPassword',
  InviteRegistration: 'InviteRegistration'
} as const

export const AppRouteNames = {
  LandlordTabs: 'LandlordTabs',
  TenantTabs: 'TenantTabs',
  VendorTabs: 'VendorTabs'
} as const

export const LandlordTabNames = {
  DashboardTab: 'DashboardTab',
  PropertiesTab: 'PropertiesTab',
  RequestsTab: 'RequestsTab',
  VendorsTab: 'VendorsTab',
  TenantsTab: 'TenantsTab',
  ProfileTab: 'ProfileTab',
  PropertyDetailsModal: 'PropertyDetailsModal',
  RequestDetailsModal: 'RequestDetailsModal',
  VendorDetailsModal: 'VendorDetailsModal',
  TenantDetailsModal: 'TenantDetailsModal'
} as const

export const TenantTabNames = {
  DashboardTab: 'DashboardTab',
  CreateRequestTab: 'CreateRequestTab',
  RequestsTab: 'RequestsTab',
  NotificationsTab: 'NotificationsTab',
  ProfileTab: 'ProfileTab',
  RequestDetailsModal: 'RequestDetailsModal'
} as const

export const VendorTabNames = {
  DashboardTab: 'DashboardTab',
  AssignedRequestsTab: 'AssignedRequestsTab',
  CompletedTab: 'CompletedTab',
  RatingsTab: 'RatingsTab',
  ProfileTab: 'ProfileTab',
  RequestDetailsModal: 'RequestDetailsModal'
} as const

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

export interface TabConfig {
  label: string
  icon: string
  testID: string
}

export const LandlordTabConfig: Record<string, TabConfig> = {
  DashboardTab: {
    label: 'Dashboard',
    icon: 'home-outline',
    testID: 'tab-dashboard-landlord'
  },
  PropertiesTab: {
    label: 'Properties',
    icon: 'building-outline',
    testID: 'tab-properties'
  },
  RequestsTab: {
    label: 'Requests',
    icon: 'construct-outline',
    testID: 'tab-requests-landlord'
  },
  VendorsTab: {
    label: 'Vendors',
    icon: 'people-outline',
    testID: 'tab-vendors'
  },
  TenantsTab: {
    label: 'Tenants',
    icon: 'person-outline',
    testID: 'tab-tenants'
  },
  ProfileTab: {
    label: 'Account',
    icon: 'settings-outline',
    testID: 'tab-profile'
  }
}

export const TenantTabConfig: Record<string, TabConfig> = {
  DashboardTab: {
    label: 'Dashboard',
    icon: 'home-outline',
    testID: 'tab-dashboard-tenant'
  },
  CreateRequestTab: {
    label: 'New Request',
    icon: 'add-circle-outline',
    testID: 'tab-create'
  },
  RequestsTab: {
    label: 'My Requests',
    icon: 'construct-outline',
    testID: 'tab-requests-tenant'
  },
  NotificationsTab: {
    label: 'Notifications',
    icon: 'notifications-outline',
    testID: 'tab-notifications'
  },
  ProfileTab: {
    label: 'Account',
    icon: 'settings-outline',
    testID: 'tab-profile-tenant'
  }
}

export const VendorTabConfig: Record<string, TabConfig> = {
  DashboardTab: {
    label: 'Dashboard',
    icon: 'home-outline',
    testID: 'tab-dashboard-vendor'
  },
  AssignedRequestsTab: {
    label: 'Assigned',
    icon: 'list-outline',
    testID: 'tab-assigned'
  },
  CompletedTab: {
    label: 'Completed',
    icon: 'checkmark-done-outline',
    testID: 'tab-completed'
  },
  RatingsTab: {
    label: 'Ratings',
    icon: 'star-outline',
    testID: 'tab-ratings'
  },
  ProfileTab: {
    label: 'Account',
    icon: 'settings-outline',
    testID: 'tab-profile-vendor'
  }
}

// ============================================================================
// SCREEN OPTIONS
// ============================================================================

export const ScreenAnimations = {
  slide: 'slide_from_right' as const,
  fade: 'fade' as const,
  none: 'none' as const
}

// ============================================================================
// DEEP LINKING
// ============================================================================

export const DeepLinkingConfig = {
  prefixes: ['rentora://', 'https://rentora.app'],
  config: {
    screens: {
      // Root
      Auth: 'auth',
      App: 'app',
      // Auth screens
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password/:token?',
      InviteRegistration: 'invite/:token',
      // Landlord screens
      DashboardTab: 'dashboard',
      PropertiesTab: 'properties',
      PropertiesTab_detail: 'properties/:propertyId',
      RequestsTab: 'requests',
      RequestsTab_detail: 'requests/:requestId',
      VendorsTab: 'vendors',
      VendorsTab_detail: 'vendors/:vendorId',
      TenantsTab: 'tenants',
      TenantsTab_detail: 'tenants/:tenantId',
      // Tenant screens
      CreateRequestTab: 'create-request',
      NotificationsTab: 'notifications',
      // Vendor screens
      AssignedRequestsTab: 'assigned',
      CompletedTab: 'completed',
      RatingsTab: 'ratings'
    }
  }
}

// ============================================================================
// REQUEST STATUS DISPLAY CONFIG
// ============================================================================

export const RequestStatusLabels: Record<string, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  VERIFIED: 'Verified'
}

export const UrgencyLabels: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ErrorMessages = {
  NETWORK_ERROR: 'Connection lost. Please check your internet and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The resource you are looking for was not found.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  FORM_VALIDATION: 'Please check the form and try again.',
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  EMAIL_EXISTS: 'This email is already registered.',
  SUBSCRIPTION_REQUIRED: 'Your subscription is not active. Please update your subscription.'
} as const

// ============================================================================
// NAVIGATION TIMING
// ============================================================================

export const NavigationTiming = {
  transitionDuration: 300,
  tabBarHeight: 60,
  headerHeight: 56,
  modalAnimationDuration: 300
} as const
