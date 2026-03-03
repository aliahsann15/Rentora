import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Provider } from 'react-redux'
import { StatusBar } from 'expo-status-bar'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts
} from '@expo-google-fonts/inter'
import { store } from './src/store'
import { colors } from './src/utils/theme'
import { AppNavigator } from './src/navigation/AppNavigator'
import { bootstrapSession } from './src/slices/authSlice'
import { useAppDispatch } from './src/hooks/useAppDispatch'
import { useAppSelector } from './src/hooks/useAppSelector'

const BootstrapGate = () => {
  const dispatch = useAppDispatch()
  const initializing = useAppSelector((state) => state.auth.initializing)

  useEffect(() => {
    dispatch(bootstrapSession())
  }, [dispatch])

  if (initializing) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} size='large' />
      </View>
    )
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
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} size='large' />
      </View>
    )
  }

  return (
    <Provider store={store}>
      <StatusBar style='dark' />
      <BootstrapGate />
    </Provider>
  )
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
