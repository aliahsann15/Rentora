import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import { RootStackParamList } from './types'
import { AuthNavigator } from './AuthNavigator'
import { AppStackNavigator } from './AppStackNavigator'
import { useAppSelector } from '../hooks/useAppSelector'
import { DeepLinkingConfig } from '../constants/navigationConstants'

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * Root Navigator
 * Entry point for all navigation in the app
 * Routes between:
 * - AuthStack: Unauthenticated user (login/register)
 * - AppStack: Authenticated user (role-based tabs)
 *
 * Uses Redux auth.user to determine which stack to show
 */
export const RootNavigator = () => {
    const user = useAppSelector((state) => state.auth.user)
    const initializing = useAppSelector((state) => state.auth.initializing)

    // While bootstrapping session from AsyncStorage, don't render anything
    // The app should show a splash screen during this time
    if (initializing) {
        return null
    }

    return (
        <NavigationContainer
            linking={DeepLinkingConfig}
            fallback={null}
        >
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'none',
                    contentStyle: { backgroundColor: '#FFFFFF' }
                }}
            >
                {user ? (
                    // User is authenticated: Show role-based app stacks
                    <Stack.Screen
                        name="App"
                        component={AppStackNavigator}
                        options={{ animation: 'none' }}
                    />
                ) : (
                    // User is not authenticated: Show auth stack
                    <Stack.Screen
                        name="Auth"
                        component={AuthNavigator}
                        options={{ animation: 'none' }}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    )
}
