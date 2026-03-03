import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import {
  LandlordPropertiesStackParamList,
  LandlordRequestsStackParamList,
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

const Tab = createBottomTabNavigator<LandlordTabParamList>()
const RequestsStack = createNativeStackNavigator<LandlordRequestsStackParamList>()
const PropertiesStack = createNativeStackNavigator<LandlordPropertiesStackParamList>()
const UsersStack = createNativeStackNavigator<LandlordUsersStackParamList>()

const RequestsNavigator = () => {
  return (
    <RequestsStack.Navigator>
      <RequestsStack.Screen name="RequestsList" component={RequestsListScreen} options={{ title: 'Requests' }} />
      <RequestsStack.Screen name="RequestDetails" component={RequestDetailsScreen} options={{ title: 'Request Details' }} />
      <RequestsStack.Screen name="AssignVendor" component={AssignVendorScreen} options={{ title: 'Assign Vendor' }} />
    </RequestsStack.Navigator>
  )
}

const PropertiesNavigator = () => {
  return (
    <PropertiesStack.Navigator>
      <PropertiesStack.Screen name="PropertiesList" component={PropertiesListScreen} options={{ title: 'Properties' }} />
      <PropertiesStack.Screen name="AddProperty" component={AddPropertyScreen} options={{ title: 'Add Property' }} />
      <PropertiesStack.Screen name="PropertyDetails" component={PropertyDetailsScreen} options={{ title: 'Property Details' }} />
      <PropertiesStack.Screen name="AddUnit" component={AddUnitScreen} options={{ title: 'Add Unit' }} />
      <PropertiesStack.Screen name="EditUnit" component={EditUnitScreen} options={{ title: 'Edit Unit' }} />
    </PropertiesStack.Navigator>
  )
}

const UsersNavigator = () => {
  return (
    <UsersStack.Navigator>
      <UsersStack.Screen name="UsersList" component={UsersListScreen} options={{ title: 'Users' }} />
      <UsersStack.Screen name="InviteUser" component={InviteUserScreen} options={{ title: 'Invite User' }} />
      <UsersStack.Screen name="VendorDetails" component={VendorDetailsScreen} options={{ title: 'Vendor Details' }} />
    </UsersStack.Navigator>
  )
}

export const LandlordNavigator = () => {
  const accentColor = getRoleAccent('LANDLORD')

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...defaultTabOptions,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Dashboard: 'grid-outline',
            Requests: 'construct-outline',
            Properties: 'business-outline',
            Users: 'people-outline',
            Settings: 'settings-outline'
          }

          return <Ionicons name={(icons[route.name] || 'help-outline') as any} size={size} color={color} />
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={LandlordDashboardScreen} />
      <Tab.Screen name="Requests" component={RequestsNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Properties" component={PropertiesNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Users" component={UsersNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}
