import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { StatusBar } from 'expo-status-bar'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts
} from '@expo-google-fonts/inter'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor, store } from './src/store'
import { AppNavigator } from './src/navigation/AppNavigator'
import { bootstrapSession, forceLogout } from './src/slices/authSlice'
import { useAppDispatch } from './src/hooks/useAppDispatch'
import { useAppSelector } from './src/hooks/useAppSelector'
import { SplashScreen } from './src/screens/auth/SplashScreen'
import { setUnauthorizedHandler } from './src/services/api'
import { setupPushNotificationsForUser } from './src/services/notificationService'

const BootstrapGate = () => {
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
    setupPushNotificationsForUser(Boolean(user))
  }, [user])

  if (initializing) {
    return <SplashScreen />
  }

  return <AppNavigator />
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
  })

  if (!fontsLoaded) {
    return <SplashScreen />
  }

  return (
    <Provider store={store}>
      <StatusBar style='dark' />
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
        <BootstrapGate />
      </PersistGate>
    </Provider>
  )
}
