import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

// ============================================================================
// ROOT NAVIGATION - Separates Auth from Authenticated App
// ============================================================================

export type RootStackParamList = {
  Auth: undefined
  App: NavigatorScreenParams<AppStackParamList>
}

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>

// ============================================================================
// AUTHENTICATED APP STACK - Routing by Role
// ============================================================================

export type AppStackParamList = {
  LandlordTabs: undefined
  TenantTabs: undefined
  VendorTabs: undefined
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

// ============================================================================
// AUTH STACK - Login/Register
// ============================================================================

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  ResetPassword: { token?: string } | undefined
  InviteRegistration: { token: string }
}

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>

// ============================================================================
// LANDLORD TABS & DETAIL MODALS
// ============================================================================

export type LandlordTabParamList = {
  DashboardTab: undefined
  PropertiesTab: undefined
  RequestsTab: undefined
  VendorsTab: undefined
  TenantsTab: undefined
  ProfileTab: undefined
  // Modals (presented over tab stack)
  PropertyDetailsModal: NavigatorScreenParams<PropertyDetailsStackParamList>
  RequestDetailsModal: NavigatorScreenParams<RequestDetailsStackParamList>
  VendorDetailsModal: NavigatorScreenParams<VendorDetailsStackParamList>
  TenantDetailsModal: NavigatorScreenParams<TenantDetailsStackParamList>
}

export type LandlordTabScreenProps<T extends keyof LandlordTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<LandlordTabParamList, T>,
  RootStackScreenProps<'App'>
>

export type PropertyDetailsStackParamList = {
  PropertyDetail: { propertyId: string }
}

export type PropertyDetailsStackScreenProps<T extends keyof PropertyDetailsStackParamList> =
  NativeStackScreenProps<PropertyDetailsStackParamList, T>

export type RequestDetailsStackParamList = {
  RequestDetail: { requestId: string; mode?: 'view' | 'manage' }
  AssignVendor: { requestId: string }
}

export type RequestDetailsStackScreenProps<T extends keyof RequestDetailsStackParamList> =
  NativeStackScreenProps<RequestDetailsStackParamList, T>

export type VendorDetailsStackParamList = {
  VendorDetail: { vendorId: string }
}

export type VendorDetailsStackScreenProps<T extends keyof VendorDetailsStackParamList> =
  NativeStackScreenProps<VendorDetailsStackParamList, T>

export type TenantDetailsStackParamList = {
  TenantDetail: { tenantId: string }
}

export type TenantDetailsStackScreenProps<T extends keyof TenantDetailsStackParamList> =
  NativeStackScreenProps<TenantDetailsStackParamList, T>

// ============================================================================
// TENANT TABS & DETAIL MODALS
// ============================================================================

export type TenantTabParamList = {
  DashboardTab: undefined
  CreateRequestTab: undefined
  RequestsTab: undefined
  NotificationsTab: undefined
  ProfileTab: undefined
  // Modals (presented over tab stack)
  RequestDetailsModal: NavigatorScreenParams<TenantRequestDetailsStackParamList>
}

export type TenantTabScreenProps<T extends keyof TenantTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TenantTabParamList, T>,
  RootStackScreenProps<'App'>
>

export type TenantRequestDetailsStackParamList = {
  RequestDetail: { requestId: string }
}

export type TenantRequestDetailsStackScreenProps<T extends keyof TenantRequestDetailsStackParamList> =
  NativeStackScreenProps<TenantRequestDetailsStackParamList, T>

// ============================================================================
// VENDOR TABS & DETAIL MODALS
// ============================================================================

export type VendorTabParamList = {
  DashboardTab: undefined
  AssignedRequestsTab: undefined
  CompletedTab: undefined
  RatingsTab: undefined
  ProfileTab: undefined
  // Modals (presented over tab stack)
  RequestDetailsModal: NavigatorScreenParams<VendorRequestDetailsStackParamList>
}

export type VendorTabScreenProps<T extends keyof VendorTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<VendorTabParamList, T>,
  RootStackScreenProps<'App'>
>

export type VendorRequestDetailsStackParamList = {
  RequestDetail: { requestId: string }
  UpdateStatus: { requestId: string }
}

export type VendorRequestDetailsStackScreenProps<T extends keyof VendorRequestDetailsStackParamList> =
  NativeStackScreenProps<VendorRequestDetailsStackParamList, T>

// ============================================================================
// UTILITY TYPES FOR NAVIGATION
// ============================================================================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
