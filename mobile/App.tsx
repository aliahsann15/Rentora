import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { Provider } from 'react-redux'
import { StatusBar } from 'expo-status-bar'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts
} from '@expo-google-fonts/inter'
import { NavigationContainer } from '@react-navigation/native'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor, store } from './src/store'
import { RootNavigator } from './src/navigation/RootNavigator'
import { bootstrapSession, forceLogout } from './src/slices/authSlice'
import { useAppDispatch } from './src/hooks/useAppDispatch'
import { useAppSelector } from './src/hooks/useAppSelector'
import { SplashScreen } from './src/screens/auth/SplashScreen'
import { setUnauthorizedHandler } from './src/services/api'
import { setupPushNotificationsForUser } from './src/services/notificationService'
import { connectNotificationsSocket, disconnectNotificationsSocket } from './src/services/notificationsSocket'
import { DeepLinkingConfig } from './src/constants/navigationConstants'
import { AppAlertProvider } from './src/providers/AppAlertProvider'

type BootstrapGateProps = {
  fontsLoaded: boolean
  splashComplete: boolean
  onSplashComplete: () => void
}

const BootstrapGate = ({ fontsLoaded, splashComplete, onSplashComplete }: BootstrapGateProps) => {
  const dispatch = useAppDispatch()
  const initializing = useAppSelector((state) => state.auth.initializing)

  useEffect(() => {
    dispatch(bootstrapSession())
  }, [dispatch])

  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(forceLogout())
    })

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [dispatch])

  useEffect(() => {
    void setupPushNotificationsForUser(user?._id)
    if (user?._id) {
      void connectNotificationsSocket(user._id)
    } else {
      disconnectNotificationsSocket()
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      return
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void setupPushNotificationsForUser(user._id)
        void connectNotificationsSocket(user._id)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [user])

  if (!fontsLoaded || initializing || !splashComplete) {
    return <SplashScreen onAnimationComplete={onSplashComplete} />
  }

  return <RootNavigator />
}

export default function App() {
  const [splashComplete, setSplashComplete] = useState(false)
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <Provider store={store}>
      <StatusBar style='dark' />
      <PersistGate loading={null} persistor={persistor}>
        <AppAlertProvider>
          <NavigationContainer linking={DeepLinkingConfig} fallback={null}>
            <BootstrapGate
              fontsLoaded={fontsLoaded}
              splashComplete={splashComplete}
              onSplashComplete={() => setSplashComplete(true)}
            />
          </NavigationContainer>
        </AppAlertProvider>
      </PersistGate>
    </Provider>
  )
}
