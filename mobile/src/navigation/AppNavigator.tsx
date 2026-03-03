/**
 * AppNavigator
 * Main navigation entry point - re-exports RootNavigator for backward compatibility
 * The actual role-based navigation architecture is implemented in:
 * - RootNavigator: Routes between Auth and App stacks
 * - AuthNavigator: Login and Register screens
 * - AppStackNavigator: Routes to role-specific navigators
 * - LandlordNavigator, TenantNavigator, VendorNavigator: Role-specific tabs and modals
 */

export { RootNavigator as AppNavigator } from './RootNavigator'
