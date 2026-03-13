import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import {
  LandlordPropertiesStackParamList,
  LandlordRequestsStackParamList,
  LandlordSettingsStackParamList,
  LandlordTabParamList,
  LandlordUsersStackParamList
} from './types'
import { colors, getRoleAccent } from '../utils/theme'
import { defaultTabOptions } from './screenOptions'
import { LandlordDashboardScreen } from '../screens/landlord/LandlordDashboardScreen'
import { RequestsListScreen } from '../screens/landlord/RequestsListScreen'
import { RequestDetailsScreen } from '../screens/landlord/RequestDetailsScreen'
import { AssignVendorScreen } from '../screens/landlord/AssignVendorScreen'
import { PropertiesListScreen } from '../screens/landlord/PropertiesListScreen'
import { AddPropertyScreen } from '../screens/landlord/AddPropertyScreen'
import { PropertyDetailsScreen } from '../screens/landlord/PropertyDetailsScreen'
import { AddUnitScreen } from '../screens/landlord/AddUnitScreen'
import { EditUnitScreen } from '../screens/landlord/EditUnitScreen'
import { UsersListScreen } from '../screens/landlord/UsersListScreen'
import { InviteUserScreen } from '../screens/landlord/InviteUserScreen'
import { VendorDetailsScreen } from '../screens/landlord/VendorDetailsScreen'
import { SettingsScreen } from '../screens/landlord/SettingsScreen'
import { ChangePasswordScreen } from '../screens/landlord/ChangePasswordScreen'
import { LandlordProfileScreen } from '../screens/landlord/LandlordProfileScreen'
import { EditLandlordProfileScreen } from '../screens/landlord/EditLandlordProfileScreen'
import { ROUTES } from './routes'

const Tab = createBottomTabNavigator<LandlordTabParamList>()
const RequestsStack = createNativeStackNavigator<LandlordRequestsStackParamList>()
const PropertiesStack = createNativeStackNavigator<LandlordPropertiesStackParamList>()
const UsersStack = createNativeStackNavigator<LandlordUsersStackParamList>()
const SettingsStack = createNativeStackNavigator<LandlordSettingsStackParamList>()

const RequestsNavigator = () => {
  return (
    <RequestsStack.Navigator screenOptions={{ headerShown: false }}>
      <RequestsStack.Screen name={ROUTES.REQUESTS_LIST} component={RequestsListScreen} options={{ title: 'Requests' }} />
      <RequestsStack.Screen name={ROUTES.REQUEST_DETAILS} component={RequestDetailsScreen} options={{ title: 'Request Details' }} />
      <RequestsStack.Screen name={ROUTES.ASSIGN_VENDOR} component={AssignVendorScreen} options={{ title: 'Assign Vendor' }} />
    </RequestsStack.Navigator>
  )
}

const PropertiesNavigator = () => {
  return (
    <PropertiesStack.Navigator screenOptions={{ headerShown: false }}>
      <PropertiesStack.Screen name={ROUTES.PROPERTIES_LIST} component={PropertiesListScreen} options={{ title: 'Properties' }} />
      <PropertiesStack.Screen name={ROUTES.ADD_PROPERTY} component={AddPropertyScreen} options={{ title: 'Add Property' }} />
      <PropertiesStack.Screen name={ROUTES.PROPERTY_DETAILS} component={PropertyDetailsScreen} options={{ title: 'Property Details' }} />
      <PropertiesStack.Screen name={ROUTES.ADD_UNIT} component={AddUnitScreen} options={{ title: 'Add Unit' }} />
      <PropertiesStack.Screen name={ROUTES.EDIT_UNIT} component={EditUnitScreen} options={{ title: 'Edit Unit' }} />
    </PropertiesStack.Navigator>
  )
}

const UsersNavigator = () => {
  return (
    <UsersStack.Navigator screenOptions={{ headerShown: false }}>
      <UsersStack.Screen name={ROUTES.USERS_LIST} component={UsersListScreen} options={{ title: 'Users' }} />
      <UsersStack.Screen name={ROUTES.INVITE_USER} component={InviteUserScreen} options={{ title: 'Invite User' }} />
      <UsersStack.Screen name={ROUTES.VENDOR_DETAILS} component={VendorDetailsScreen} options={{ title: 'Vendor Details' }} />
    </UsersStack.Navigator>
  )
}

const SettingsNavigator = () => {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name={ROUTES.SETTINGS_HOME} component={SettingsScreen} options={{ title: 'Settings' }} />
      <SettingsStack.Screen name={ROUTES.LANDLORD_PROFILE} component={LandlordProfileScreen} options={{ title: 'Settings' }} />
      <SettingsStack.Screen name={ROUTES.EDIT_LANDLORD_PROFILE} component={EditLandlordProfileScreen} options={{ title: 'Edit Profile' }} />
      <SettingsStack.Screen name={ROUTES.CHANGE_PASSWORD} component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
    </SettingsStack.Navigator>
  )
}

export const LandlordNavigator = () => {
  const accentColor = getRoleAccent('LANDLORD')
  const tabIcons: Record<keyof LandlordTabParamList, keyof typeof Ionicons.glyphMap> = {
    [ROUTES.DASHBOARD]: 'grid-outline',
    [ROUTES.REQUESTS]: 'construct-outline',
    [ROUTES.PROPERTIES]: 'business-outline',
    [ROUTES.USERS]: 'people-outline',
    [ROUTES.SETTINGS]: 'settings-outline'
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...defaultTabOptions,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const iconName = tabIcons[route.name as keyof LandlordTabParamList] || 'help-outline'
          return <Ionicons name={iconName} size={size} color={color} />
        }
      })}
    >
      <Tab.Screen name={ROUTES.DASHBOARD} component={LandlordDashboardScreen} />
      <Tab.Screen name={ROUTES.REQUESTS} component={RequestsNavigator} options={{ headerShown: false }} />
      <Tab.Screen name={ROUTES.PROPERTIES} component={PropertiesNavigator} options={{ headerShown: false }} />
      <Tab.Screen name={ROUTES.USERS} component={UsersNavigator} options={{ headerShown: false }} />
      <Tab.Screen name={ROUTES.SETTINGS} component={SettingsNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  )
}
