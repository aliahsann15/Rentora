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
// LANDLORD TABS & STACKS
// ============================================================================

export type LandlordTabParamList = {
  Dashboard: undefined
  Requests: NavigatorScreenParams<LandlordRequestsStackParamList>
  Properties: NavigatorScreenParams<LandlordPropertiesStackParamList>
  Users: NavigatorScreenParams<LandlordUsersStackParamList>
  Settings: undefined
}

export type LandlordTabScreenProps<T extends keyof LandlordTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<LandlordTabParamList, T>,
  RootStackScreenProps<'App'>
>

export type LandlordRequestsStackParamList = {
  RequestsList: {
    status?: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED'
    propertyId?: string
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH'
  } | undefined
  RequestDetails: { requestId: string }
  AssignVendor: { requestId: string }
}

export type LandlordRequestsStackScreenProps<T extends keyof LandlordRequestsStackParamList> =
  NativeStackScreenProps<LandlordRequestsStackParamList, T>

export type LandlordPropertiesStackParamList = {
  PropertiesList: undefined
  AddProperty: undefined
  PropertyDetails: { propertyId: string }
  AddUnit: { propertyId: string }
  EditUnit: { unitId: string }
}

export type LandlordPropertiesStackScreenProps<T extends keyof LandlordPropertiesStackParamList> =
  NativeStackScreenProps<LandlordPropertiesStackParamList, T>

export type LandlordUsersStackParamList = {
  UsersList: undefined
  InviteUser: undefined
  VendorDetails: { vendorId: string }
}

export type LandlordUsersStackScreenProps<T extends keyof LandlordUsersStackParamList> =
  NativeStackScreenProps<LandlordUsersStackParamList, T>

// ============================================================================
// TENANT TABS & STACK
// ============================================================================

export type TenantTabParamList = {
  MyRequests: NavigatorScreenParams<TenantRequestsStackParamList>
  NewRequest: undefined
  Profile: undefined
}

export type TenantTabScreenProps<T extends keyof TenantTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TenantTabParamList, T>,
  RootStackScreenProps<'App'>
>

export type TenantRequestsStackParamList = {
  MyRequestsList: undefined
  TenantRequestDetails: { requestId: string }
}

export type TenantRequestsStackScreenProps<T extends keyof TenantRequestsStackParamList> =
  NativeStackScreenProps<TenantRequestsStackParamList, T>

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
