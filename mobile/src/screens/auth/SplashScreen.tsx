import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors, typography } from '../../utils/theme'

export const SplashScreen = () => {
  return (
    <View style={styles.root}>
      <Text style={styles.logo}>Rentora</Text>
      <ActivityIndicator color={colors.primary} size='large' />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16
  },
  logo: {
    fontSize: typography.headingL,
    color: colors.primary,
    fontFamily: 'Inter_700Bold'
  }
})
